import {
    InMemoryDbService,
    ParsedRequestUrl,
    RequestInfo,
    RequestInfoUtilities,
    ResponseOptions
} from 'angular-in-memory-web-api';
import { ActionItemFakeDb, AssetsFakeDb, GenerationFakeDb, MxFilterTagFakeDb } from './aagt';

export class FakeDbService implements InMemoryDbService {
    private resourceRegEx = /'(\w+)'/i;
    // private filterRegEx = /(?<=\$filter=)(?<filterProp>\w+)|(?<=\s)(?<operation>\w{2,3})(?=\s)|(?<=\s)'(?<filterVal>\S+?)'/gmi;
    // private urlBase = 'https://cs2.eis.af.mil/sites/10918/mx-maintainer';

    constructor() {
    }

    private getDatabase(inMemDb: any, dbFunc: any): void {
        const propName = dbFunc.dbKey;
        const newedUpClass = new dbFunc();
        inMemDb[propName] = newedUpClass.entities;
        console.log(`created db for: ${propName}`);
        return inMemDb;
    }

    createDb(): any {
        const inMemDb = {} as any;
        this.getDatabase(inMemDb, AssetsFakeDb);
        this.getDatabase(inMemDb, GenerationFakeDb);
        this.getDatabase(inMemDb, ActionItemFakeDb);
        this.getDatabase(inMemDb, MxFilterTagFakeDb);
        return inMemDb;
    }

    parseRequestUrl(url: string, utils: RequestInfoUtilities): ParsedRequestUrl {
        const clean_url = decodeURIComponent(url);
        const filterParams = this.implementFilterOps(clean_url);
        const resource = clean_url.includes(`(`) ? clean_url.match(this.resourceRegEx)[1] : null;
        const newUrl = utils.parseRequestUrl(url);
        newUrl.collectionName = resource;
        newUrl.id = null;
        newUrl.query = null;
        // if (filterParams !== null) {
        //     newUrl.query = filterParams;
        // }
        console.log(`parseRequestUrl override of '${clean_url}':`, newUrl);
        return newUrl;
    }

    responseInterceptor(resOptions: ResponseOptions, _reqInfo: RequestInfo) {
        console.log(resOptions.body);
        resOptions.body = JSON.stringify({ d: { results: resOptions.body } });
        return resOptions;
    }

    post(reqInfo: RequestInfo): any {
        const endPoint = reqInfo.url.substring(reqInfo.url.lastIndexOf('/') + 1);
        console.log(endPoint);
        if (!endPoint) { return null; }
        switch (endPoint.toLowerCase()) {
            case 'contextinfo':
                return reqInfo.utils.createResponse$(this.respondWithContextInfo);
        }
    }

    private respondWithContextInfo(): ResponseOptions {
        const response: ResponseOptions = {};
        response.status = 200;
        response.headers.set('Content-Type', 'application/json;odata=verbose;charset=utf-8');
        response.body = `{"d":
   {"GetContextWebInformation":
   {"__metadata":
   {"type":"SP.ContextWebInformation"},
   "FormDigestTimeoutSeconds":900,
   "FormDigestValue":
   "0xE575B4A3390A1517D49572A1134CF61F913401E145FC83D2D86B6C85860504F5BEE513B543F69E3CBFC84EE34D8682A489D52C313C0C925E8ED3AA1DB53F36C2,
    29 Oct 2018 16:28:18 -0000",
   "LibraryVersion":"15.0.4989.1001",
   "SiteFullUrl":"https://cs2.eis.af.mil/sites/10918",
   "SupportedSchemaVersions":
   {"__metadata":
   {"type":"Collection(Edm.String)"},
   "results":["14.0.0.0","15.0.0.0"]},"WebFullUrl":"https://cs2.eis.af.mil/sites/10918/mx-maintainer"}}}`;
        return response;
    }

    private implementFilterOps(filterUrl: string): string {
        if (!filterUrl.includes('$filter')) {
            return null;
        }
        const filterRegEx = /\$filter=(?<filterProp>\w+)\s+?(?<operator>\w{2,3})\W(?<findValue>\S+?)/i;
        console.log(`for url: ${filterUrl}`);
        const foundMatches = filterUrl.match(filterRegEx) as any;

        const filterQuery = `${foundMatches.groups.filterProp}=^${foundMatches.groups.findValue}`;
        console.log(`filter done => ${filterQuery}`);
        return filterQuery;
    }

}
