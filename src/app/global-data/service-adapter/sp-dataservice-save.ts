import { AutoGeneratedKeyType, DataProperty, DataType, Entity, EntityKey, EntityState, HttpResponse, SaveBundle, SaveContext, SaveResult } from 'breeze-client';

import { CustomDataServiceUtils } from './sp-dataservice-utils';

export class CustomSaveContext {
    private headers: Object;

    constructor(private saveContext: SaveContext, private saveBundle: SaveBundle, private utils: CustomDataServiceUtils) {}

    private addKeyMapping(response: HttpResponse, index: number, unwrappedResponse: any): any {
        const tempKey = response.saveContext.tempKeys[index] as EntityKey;
        if (tempKey) {
            // entity had a temporary key; add a temp-to-perm key mapping
            const entityType = tempKey.entityType;
            const tempValue = tempKey.values[0];
            const realKey = entityType.getEntityKeyFromRawEntity(entityType, unwrappedResponse);
            const keyMapping = {
                entityTypeName: entityType.name,
                tempValue,
                realValue: realKey.values[0]
            };
            response.saveContext.saveResult.keyMappings.push(keyMapping);
        }
    }

    private unwrapResponse(response: HttpResponse, index: number): Entity {
        let savedData = this.utils.unwrapResponseData(response) as any;
        const originalEntity = response.saveContext.originalEntities[index];

        if (savedData && typeof savedData === 'object') {
            // Have "saved entity" data; add its type (for JsonResultsAdapter) & KeyMapping
            savedData.$entityType = originalEntity.entityType;
            const etag = savedData && savedData.entityAspect && response.getHeaders('ETag');
            if (etag) {
                savedData.entityAspect.extraMetadata.etag = etag;
            }
            this.addKeyMapping(response, index, savedData);
        } else {
            // No "saved entity" data; return the original entity
            savedData = originalEntity as any;
        }
        this.saveContext.saveResult.entities.push(savedData);
        return savedData;
    }

    private prepareSaveBundles(): Array<Promise<Entity>> {
        this.saveContext.tempKeys = [];
        this.saveContext.originalEntities = this.saveBundle.entities;
        const saveResult: SaveResult = {
            entities: [],
            entitiesWithErrors: [],
            keyMappings: []
        };
        this.saveContext.saveResult = saveResult;
        const saveCombo = this.saveBundle.entities.map((entity, index) => {
            const state = entity.entityAspect.entityState;
            switch (state) {
                case EntityState.Added:
                    return this.processAddChangeSet(entity, index);
                case EntityState.Modified:
                    return this.processDeleteChangeSet(entity, index);
                case EntityState.Deleted:
                    return this.processModifyChangeSet(entity, index);
                default:
                    throw new Error(`Cannot save an entity whose EntityState is ${state.name}`);
            }
        });
        return saveCombo;
    }

    private processAddChangeSet(entity: Entity, index: number): Promise<Entity> {
        const defaultHeaders = {};
        Object.assign(defaultHeaders, this.headers);
        let rawEntity: any;
        const url = this.saveContext.dataService.qualifyUrl(this.saveContext.resourceName);
        const em = this.saveContext.entityManager;
        const et = entity.entityType;
        const aspect = entity.entityAspect;
        const helper = em.helper;

        if (!et.defaultResourceName) {
            throw new Error(`Missing resource name for type: ${et.name}`);
        }

        if (et.autoGeneratedKeyType !== AutoGeneratedKeyType.None) {
            this.saveContext.tempKeys[index] = aspect.getKey();
        }

        rawEntity = helper.unwrapInstance(entity, this.normalizeSaveValue);

        rawEntity.__metadata = {
            type: this.utils.clientTypeNameToServer(et.shortName)
        };

        const payload = JSON.stringify(rawEntity);
        const that = this;
        return new Promise<Entity>((resolve, reject) => {
            function success(response: HttpResponse): void {
                response.saveContext = that.saveContext;
                const data = that.utils.unwrapResponseData(response);

                if (data && (data.Error || data.error)) {
                    that.utils.handleHttpErrors(reject, response);
                } else {
                    const saveResult = that.unwrapResponse(response, index) as Entity;
                    resolve(saveResult);
                }
            }

            function failed(response: HttpResponse): void {
                response.saveContext = this.saveContext;
                that.saveContext.saveResult.entitiesWithErrors.push(that.saveContext.originalEntities[index]);
                that.utils.handleHttpErrors(reject, response);
            }
            const requestCfg = {
                url: url + et.defaultResourceName,
                type: 'POST',
                data: payload,
                headers: defaultHeaders,
                success: (response: HttpResponse) => success(response),
                error: (response: HttpResponse) => failed(response)
            };

            this.utils.ajaxAdapter.ajax(requestCfg);
        }).catch(error => new Error(error) as any);
    }

    private processDeleteChangeSet(entity: Entity, index: number): Promise<Entity> {
        const defaultHeaders = {};
        Object.assign(defaultHeaders, this.headers);
        // const url = this.saveContext.dataService.qualifyUrl(this.saveContext.resourceName);
        const et = entity.entityType;
        const aspect = entity.entityAspect;

        if (!et.defaultResourceName) {
            throw new Error(`Missing resource name for type: ${et.name}`);
        }
        const that = this;
        return new Promise<Entity>((resolve, reject) => {
            const extraMetadata = aspect.extraMetadata;
            if (!extraMetadata) {
                throw new Error(`Missing the extra metadata for an update/delete entity`);
            }
            if (extraMetadata.etag) {
                defaultHeaders['If-Match'] = extraMetadata.etag;
            }
            const url = extraMetadata.uri || extraMetadata.id;

            function success(response: HttpResponse): void {
                response.saveContext = that.saveContext;
                const data = that.utils.unwrapResponseData(response);

                if (data && (data.Error || data.error)) {
                    that.utils.handleHttpErrors(reject, response);
                } else {
                    const saveResult = that.unwrapResponse(response, index) as Entity;
                    resolve(saveResult);
                }
            }

            function failed(response: HttpResponse): void {
                response.saveContext = this.saveContext;
                that.utils.handleHttpErrors(reject, response);
            }
            const requestCfg = {
                url: url + et.defaultResourceName,
                type: 'DELETE',
                data: null,
                headers: defaultHeaders,
                success: (response: HttpResponse) => success(response),
                error: (response: HttpResponse) => failed(response)
            };

            this.utils.ajaxAdapter.ajax(requestCfg);
        }).catch(error => new Error(error) as any);
    }

    private processModifyChangeSet(entity: Entity, index: number): Promise<Entity> {
        const defaultHeaders = {};
        Object.assign(defaultHeaders, this.headers);
        defaultHeaders['X-HTTP-Method'] = 'MERGE';

        let rawEntity: any;
        const em = this.saveContext.entityManager;
        const et = entity.entityType;
        const aspect = entity.entityAspect;
        const helper = em.helper;

        if (!et.defaultResourceName) {
            throw new Error(`Missing resource name for type: ${et.name}`);
        }

        if (et.autoGeneratedKeyType !== AutoGeneratedKeyType.None) {
            this.saveContext.tempKeys[index] = aspect.getKey();
        }

        rawEntity = helper.unwrapChangedValues(entity, em.metadataStore, this.normalizeSaveValue);

        rawEntity.__metadata = {
            type: aspect.extraMetadata.type
        };

        const payload = JSON.stringify(rawEntity);
        const that = this;
        return new Promise<Entity>((resolve, reject) => {
            const extraMetadata = aspect.extraMetadata;
            if (!extraMetadata) {
                throw new Error(`Missing the extra metadata for an update/delete entity`);
            }
            const url = extraMetadata.uri || extraMetadata.id;
            if (extraMetadata.etag) {
                defaultHeaders['If-Match'] = extraMetadata.etag;
            }
            function success(response: HttpResponse): void {
                response.saveContext = that.saveContext;
                const data = that.utils.unwrapResponseData(response);

                if (data && (data.Error || data.error)) {
                    that.utils.handleHttpErrors(reject, response);
                } else {
                    const saveResult = that.unwrapResponse(response, index) as Entity;
                    resolve(saveResult);
                }
            }

            function failed(response: HttpResponse): void {
                response.saveContext = this.saveContext;
                that.saveContext.saveResult.entitiesWithErrors.push(that.saveContext.originalEntities[index]);
                that.utils.handleHttpErrors(reject, response);
            }
            const requestCfg = {
                url: url + et.defaultResourceName,
                type: 'POST',
                data: payload,
                headers: defaultHeaders,
                success: (response: HttpResponse) => success(response),
                error: (response: HttpResponse) => failed(response)
            };

            this.utils.ajaxAdapter.ajax(requestCfg);
        }).catch(error => new Error(error) as any);
    }

    private normalizeSaveValue(prop: DataProperty, val: any): any {
        if (prop.isUnmapped) {
            return undefined;
        }
        if (prop.dataType === DataType.DateTimeOffset) {
            val = val && new Date(val.getTime() - val.getTimezoneOffset() * 60000);
        } else if (prop.dataType) {
            // quoteJsonOData
            val = val != null ? val.toString() : val;
        }
        return val;
    }

    private reviewSaveResult(entityResults: Entity[]) {
        // const saveResult = this.saveContext.saveResult;
        // const etWithErrors = saveResult.entitiesWithErrors;
        // const errorCount = etWithErrors.length;
        // if (!errorCount) { return saveResult; }  // all good
    }

    async save(headers: Object): Promise<SaveResult> {
        this.headers = headers;
        const saveCombobundle = [...this.prepareSaveBundles()];
        try {
            await Promise.all(saveCombobundle);
            return this.saveContext.saveResult;
            // var error;
            // // Compose error; promote the first error when one or all fail
            // if (requests.length === 1 || requests.length === errorCount) {
            //     // When all fail, good chance the first error is the same reason for all
            //     error = entitiesWithErrors[0].error;
            // } else {
            //     error = new Error("\n The save failed although some entities were saved.");
            // }
            // error.message = (error.message || "Save failed") +
            //     "  \n See 'error.saveResult' for more details.\n";
            // error.saveResult = saveResult;
            // return Q.reject(error);
        } catch (e) {}
    }
}
