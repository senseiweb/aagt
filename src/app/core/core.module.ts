import { NgModule, Optional, SkipSelf } from '@angular/core';
import { EmProviderService, BaseRepoService} from './data';
import { AppSharedModule  } from 'app/app-shared.module';
import {
  EntityBase,
  GeneratorOps,
  SpAppConfig,
  ActionItem,
  AssetTriggerTask,
  Asset,
  Assumption,
  Producer,
  RegistrationHelper,
  SpMetadata,
  Trigger,
  TriggerProductionCapability,
  WorkShift,
  AagtAppConfig
} from './entities';

@NgModule({
  imports: [
    AppSharedModule
  ],
  exports: [
  ],
  providers: [
    EmProviderService,
    AagtAppConfig,
    BaseRepoService,
    EntityBase,
    GeneratorOps,
    SpAppConfig,
    ActionItem,
    AssetTriggerTask,
    Asset,
    Assumption,
    Producer,
    RegistrationHelper,
    SpAppConfig,
    SpMetadata,
    Trigger,
    TriggerProductionCapability,
    WorkShift
  ],
  declarations: []
})
export class CoreModule {

  constructor(@Optional() @SkipSelf()core: CoreModule) {
    if (core) {
      throw new Error('Core Module is injected only once into the main app module');
    }
  }
}