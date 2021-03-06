import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';

import { FusecContentModule } from '../../components/content/fusec-content.module';
import { FusecFooterModule } from '../../components/footer/fusec-footer.module';
import { FusecNavbarModule } from '../../components/navbar/fusec-navbar.module';
import { FusecQuickPanelModule } from '../../components/quick-panel/fusec-quick-panel.module';
import { FusecToolbarModule } from '../../components/toolbar/fusec-toolbar.module';

import { FusecVerticalLayout1Component } from './fusec-layout-1.component';

@NgModule({
    declarations: [
        FusecVerticalLayout1Component
    ],
    imports     : [
        RouterModule,

        FuseSharedModule,
        FuseSidebarModule,

        FusecContentModule,
        FusecFooterModule,
        FusecNavbarModule,
        FusecQuickPanelModule,
        FusecToolbarModule
    ],
    exports     : [
        FusecVerticalLayout1Component
    ]
})
export class FusecVerticalLayout1Module {
}
