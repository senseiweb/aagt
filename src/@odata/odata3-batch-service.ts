// tslint:disable-next-line: no-submodule-imports
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { HttpResponse } from 'breeze-client';
import { OData3Batch } from './odata3-batch';
import { OData3Changeset } from './odata3-changeset';
import { OData3Request } from './odata3-request';
import { OData3Response } from './odata3-response';

@Injectable({ providedIn: 'root' })
export class OData3BatchService {
    private contentTypeRegExp: RegExp;
    private uuid: UUID;

    /** Allows injection of uuid module for mocking */
    constructor(private http: HttpClient) {
        this.contentTypeRegExp = RegExp('^content-type', 'i');
    }
    createBatch(url: string): OData3Batch {
        const batchUuid = UUID.UUID();
        const batch = new OData3Batch(url, batchUuid);
        return batch;
    }

    createChangeset(uuid: UUID): OData3Changeset {
        return new OData3Changeset(uuid);
    }

    createRequest(
        method: string,
        url: string,
        data: {},
        contentId: string,
        requestHeaders: { [index: string]: string }
    ): OData3Request {
        return new OData3Request(method, url, data, contentId, requestHeaders);
    }

    async submitBatch(
        batch: OData3Batch
    ): Promise<{ responses: OData3Response[]; rawResponse: HttpResponse }> {
        const batchRequest = batch.getBatchRequest();
        const rawResponse = (await this.http
            .post(batchRequest.url, batchRequest.body, {
                headers: batchRequest.headers,
                responseType: 'text',
                observe: 'response'
            })
            .toPromise()) as any;
        console.log(rawResponse);
        const responses = this.parseBatchResponse(rawResponse);
        return { responses, rawResponse };
    }

    private parseBatchResponse(response: Response): any[] {
        const header = response.headers.get('content-type');
        const m = header.match(/boundary=([^;]+)/);
        if (!m) {
            throw new Error('Bad content-type header, no multipart boundary');
        }
        const boundary = m[1];
        const responses = this.parseBatch(boundary, response);
        responses.forEach((r, i) => (r.TempKeyIndex = i + 1));
        return responses;
    }

    private parseBatch(boundary: string, response: Response): OData3Response[] {
        let batchResponses = [];
        const body = (response.body as any) as string;
        // Split the batch result into its associated parts
        const batchPartRegex = RegExp('--' + boundary + '(?:\r\n)?(?:--\r\n)?');
        const batchParts = body.split(batchPartRegex);
        // console.log("Batch Parts:");
        // console.log(batchParts);
        const batchPartBoundaryTypeRegex = RegExp('boundary=(.+)', 'm');

        batchParts.forEach(batchPart => {
            if (!this.contentTypeRegExp.test(batchPart)) {
                return;
            }

            // console.log("-- Content for Batch Part " + i);
            // For each batch part, check to see if the part is a changeset.
            const changeSetBoundaryMatch = batchPart.match(
                batchPartBoundaryTypeRegex
            );
            // console.log("----Boundary Search for item " + i)
            if (changeSetBoundaryMatch) {
                // console.log("----Boundary Found for item " + i)
                // console.log(changeSetBoundaryMatch)
                // console.log("Getting changeset")
                const changeSetBoundary = changeSetBoundaryMatch[1];
                const changeSetContentRegex = RegExp(
                    '(--' +
                        changeSetBoundary +
                        '\r\n[^]+--' +
                        changeSetBoundary +
                        ')',
                    'i'
                );
                const changeSetBody = batchPart.match(changeSetContentRegex);
                // console.log("changeSetBody")
                // console.log(changeSetBody)
                const changeSetPartRegex = RegExp(
                    '--' + changeSetBoundary + '(?:\r\n)?(?:--\r\n)?'
                );
                const changeSetParts = changeSetBody[1].split(
                    changeSetPartRegex
                );
                // console.log("changeSetParts")
                // console.log(changeSetParts);
                // console.log("Getting Changeset Parts");
                const changeSetResponses = this.parseResponses(changeSetParts);
                // console.log("Change Set Responses");
                // console.log(changeSetResponses)
                batchResponses = batchResponses.concat(changeSetResponses);
            } else {
                // console.log("----Boundary Not Found for batch part " + i)
                // console.log("----PArsing batch part " + i);
                if (this.contentTypeRegExp.test(batchPart)) {
                    const parsedResponse = this.parseResponse(batchPart);
                    // console.log(response);
                    batchResponses.push(parsedResponse);
                }
            }
        });

        // for (let i = 0; i < batchParts.length; i++) {
        //     const batchPart = batchParts[i];
        //     if (this.contentTypeRegExp.test(batchPart)) {
        //         // console.log("-- Content for Batch Part " + i);
        //         // For each batch part, check to see if the part is a changeset.
        //         const changeSetBoundaryMatch = batchPart.match(batchPartBoundaryTypeRegex);
        //         // console.log("----Boundary Search for item " + i)
        //         if (changeSetBoundaryMatch) {
        //             // console.log("----Boundary Found for item " + i)
        //             // console.log(changeSetBoundaryMatch)
        //             // console.log("Getting changeset")
        //             const changeSetBoundary = changeSetBoundaryMatch[1];
        //             const changeSetContentRegex = RegExp('(--' + changeSetBoundary + '\r\n[^]+--' + changeSetBoundary + ')', 'i');
        //             const changeSetBody = batchPart.match(changeSetContentRegex);
        //             // console.log("changeSetBody")
        //             // console.log(changeSetBody)
        //             const changeSetPartRegex = RegExp('--' + changeSetBoundary + '(?:\r\n)?(?:--\r\n)?');
        //             const changeSetParts = changeSetBody[1].split(changeSetPartRegex);
        //             // console.log("changeSetParts")
        //             // console.log(changeSetParts);
        //             // console.log("Getting Changeset Parts");
        //             const changeSetResponses = this.parseResponses(changeSetParts);
        //             // console.log("Change Set Responses");
        //             // console.log(changeSetResponses)
        //             batchResponses = batchResponses.concat(changeSetResponses);
        //         } else {
        //             // console.log("----Boundary Not Found for batch part " + i)
        //             // console.log("----PArsing batch part " + i);
        //             if (this.contentTypeRegExp.test(batchPart)) {
        //                 const parsedResponse = this.parseResponse(batchPart);
        //                 // console.log(response);
        //                 batchResponses.push(parsedResponse);
        //             }
        //         }
        //     }
        // }
        // console.log("Batch Responses:");
        // console.log(batchResponses);
        return batchResponses;
    }

    private parseResponse(part: string): OData3Response {
        const response = part.split('\r\n\r\n');
        // console.log(response);
        // response[1] are headers for the part
        // response[2] is the response code and headers
        // response[3] is data
        const httpResponseWithHeaders = response[1].split('\r\n');
        // console.log("httpResponseWithHeaders");
        // console.log(httpResponseWithHeaders);
        const responseRegex = RegExp('HTTP/1.1 ([0-9]{3}) (.+)');
        const httpCodeAndDesc = httpResponseWithHeaders[0].match(responseRegex);
        // console.log("httpCodeAndDesc");
        // console.log(httpCodeAndDesc);
        const httpCode = httpCodeAndDesc[1];
        const httpDesc = httpCodeAndDesc[2];
        // console.log("httpCode");
        // console.log(httpCode);
        // console.log("httpDesc");
        // console.log(httpDesc);
        const httpHeaders = [];
        const headerKvReg = RegExp('(.+): (.+)');
        httpResponseWithHeaders.forEach(header => {
            if (!headerKvReg.test(header)) {
                return;
            }
            const headerKeyAndValue = header.match(headerKvReg);
            httpHeaders.push({
                Key: headerKeyAndValue[1],
                Value: headerKeyAndValue[2]
            });
        });
        // for (let h = 1; h < httpResponseWithHeaders.length; h++) {
        //     const header = httpResponseWithHeaders[h];
        //     const headerKeyAndValue = header.match('(.+): (.+)');
        //     // console.log("headerTypeAndValue");
        //     // console.log(headerTypeAndValue);
        //     httpHeaders.push({
        //         Key: headerKeyAndValue[1],
        //         Value: headerKeyAndValue[2]
        //     });
        // }
        const responseOut = {
            ResponseCode: httpCode,
            ResponseText: httpDesc,
            Headers: httpHeaders,
            Data: response[2].match(/.*/)[0],
            Success:
                +httpCode.substring(0, 1) !== 4 &&
                +httpCode.substring(0, 1) !== 5
        };
        return responseOut;
    }

    private parseResponses(parts: string[]): OData3Response[] {
        const responses = [];
        parts.forEach(part => {
            if (part) {
                const response = this.parseResponse(part);
                responses.push(response);
            }
        });

        // for (let j = 0; j < parts.length; j++) {
        //     const part = parts[j];
        //     // console.log("Getting changeset part "+ j)
        //     // console.log(part);
        //     // console.log("Getting response from changeset part " + j)
        //     if (part != '') {
        //         const response = this.parseResponse(part);
        //         responses.push(response);
        //     }
        // }
        return responses;
    }
}
