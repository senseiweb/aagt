import { Injectable } from '@angular/core';
import { BaseRepoService, EmProviderService } from 'app/data';
import { BaseSpJsom } from 'app/data/repos/base-spjsom-repo.service';
import { ActionItem, AagtListName } from '../models';
import { AagtDataModule } from '../aagt-data.module';

@Injectable({ providedIn: AagtDataModule })
export class ActionItemRepo extends BaseRepoService<ActionItem> {
    constructor (emService: EmProviderService) {
        super(AagtListName.ActionItem, emService);
    }

    create(): ActionItem {
        return this.createBase({ action: 'this is a test' , availableForUse: false });
    }
}