import { Injectable } from '@angular/core';
import { RegistrationHelper } from '../entities';
import { AagtAppConfig } from '../aagt-app-config';
import * as breeze from 'breeze-client';
import 'breeze-client-labs/breeze.labs.dataservice.abstractrest';
import 'breeze-client-labs/breeze.labs.dataservice.sharepoint';
import 'breeze-client-labs/breeze.namingConventionWithDictionary';

@Injectable({
  providedIn: 'root'
})
export class EmProviderService {
  activate = false;
  coreEntityManager: breeze.EntityManager;

  constructor(
    private _regHelper: RegistrationHelper,
    private _aagtConfig: AagtAppConfig,
  ) {
    this.init();
  }

  init(): void {
    const dataAdapter = breeze.config.initializeAdapterInstance('dataService', 'SharePointOData', true) as any;
    dataAdapter.getRequestDigest = () => this._aagtConfig.rawRequestDigest;

    const clientToServerNameDictionary = {
      'SpConfigData:#SP.AAGT': { configKey: 'Title' }
    };
    const nc = <any> breeze.NamingConvention;
    const convention = new nc.NamingConventionWithDictionary(
      'spNameConv', breeze.NamingConvention.camelCase, clientToServerNameDictionary);

    convention.setAsDefault();

    const dataService = new breeze.DataService({
      serviceName: `${this._aagtConfig.appWebUrl}/_api/web`,
      hasServerMetadata: false
    });

    this.coreEntityManager = new breeze.EntityManager({ dataService: dataService });
    const metaHelper = new breeze.config.MetadataHelper('SP.AAGT', breeze.AutoGeneratedKeyType.Identity);

    this._regHelper.register(this.coreEntityManager.metadataStore, metaHelper);
  }
}
