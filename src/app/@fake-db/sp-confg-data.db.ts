import { SpConfigData, bareEntity, SpCfgIsoType, configKeyEnum } from 'app/core';
import * as faker from 'faker';
import { FakeSpDb } from './_fake-db.service';

export class SpConfigDataFakeDb implements FakeSpDb<SpConfigData> {
  static dbKey = 'SpConfigData';
  private bareSpCfgDataEntity: bareEntity<SpConfigData>[] = [];

  constructor() {
    const isoTypeEntity = {} as any;
    isoTypeEntity.Title = configKeyEnum.isoTypes;
    isoTypeEntity.ConfigValue = ['Hetic Roller', 'Global Thunder', 'World of Waldo'];
    isoTypeEntity.id = 1;
    this.bareSpCfgDataEntity.push(isoTypeEntity);
  }

  get entities(): any {
    return this.bareSpCfgDataEntity;
  }
}
