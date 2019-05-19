import { DataSource } from '@angular/cdk/table';
import { AssetTriggerAction } from 'app/features/aagt/data';
import { EntityAction } from 'breeze-client';
import * as _ from 'lodash';
import { merge, BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilKeyChanged, filter, map, tap } from 'rxjs/operators';
import { PlannerUowService } from '../planner-uow.service';

export class AssetTriggerActionDataSource extends DataSource<
    AssetTriggerAction
> {
    private datasource = this.planUow.aagtEmService.onEntityManagerChange.pipe(
        // filter(x => x.shortName === ),
        // filter(
        //     ec =>
        //         ec.entityAction === '' ||
        //         (ec.entityAction === EntityAction.PropertyChange &&
        //             ec.args.propertyName === 'isSoftDeleted')
        // ),
        distinctUntilKeyChanged(
            'entity',
            (entity1, entity2) => entity1.id === entity2.id
        )
    );

    constructor(
        private planUow: PlannerUowService,
        private triggerFilterChange: BehaviorSubject<string>,
        private assetFilterChange: BehaviorSubject<string>
    ) {
        super();
    }

    get assetTrigActData() {
        return _.flatMap(this.planUow.currentGen.triggers, x =>
            _.flatMap(x.triggerActions, m => m.assetTriggerActions)
        );
    }

    connect(): Observable<AssetTriggerAction[]> {
        const displayDataChanges = [
            this.datasource,
            this.assetFilterChange,
            this.triggerFilterChange
        ];

        return merge(...displayDataChanges).pipe(
            tap(ec => {
                console.log('Ata List');
                console.log(ec);
            }),
            map(noChoice => {
                const assetFilter = this.assetFilterChange.value;
                const triggerFilter = this.triggerFilterChange.value;
                console.table(this.assetTrigActData);
                return this.assetTrigActData.slice().filter(ata => {
                    let matchedRecord = false;
                    if (
                        !this.assetFilterChange.value &&
                        !this.triggerFilterChange.value
                    ) {
                        return true;
                    }
                    if (this.assetFilterChange.value) {
                        matchedRecord =
                            assetFilter === 'all' ||
                            ata.genAsset.asset.alias === assetFilter;
                    }
                    if (!matchedRecord || triggerFilter) {
                        matchedRecord =
                            triggerFilter === 'all' ||
                            ata.triggerAction.trigger.milestone ===
                                triggerFilter;
                    }
                    return matchedRecord;
                });
            })
        );
    }

    disconnect() {}
}
