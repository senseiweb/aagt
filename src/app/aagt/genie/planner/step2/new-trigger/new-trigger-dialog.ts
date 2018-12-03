import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Component, Inject, OnInit, Input, Output } from '@angular/core';
import { PlannerUowService } from '../../planner-uow.service';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Trigger } from 'app/aagt/data';

@Component({
    selector: 'new-trigger-dialog',
    templateUrl: './new-trigger-dialog.html'
})
export class NewTriggerDialogComponent implements OnInit {

    currentTrigger: Trigger;
    triggerFormGroup: FormGroup;
    isNew = false;

    constructor(private dialogRef: MatDialogRef<NewTriggerDialogComponent>,
        private formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA)  data: any) {
        this.currentTrigger = data;
    }

    ngOnInit(): void {
        const trig = this.currentTrigger;
        this.triggerFormGroup = this.formBuilder.group({
            milestone: new FormControl(trig.milestone, Validators.required),
            offset: new FormControl(trig.generationOffset),
            start: new FormControl(trig.triggerStart),
            stop: new FormControl(trig.triggerStop)
        });
    }

    cancel(): void {
        this.currentTrigger.entityAspect.rejectChanges();
        this.dialogRef.close();
    }

    saveChanges(): void {
        this.currentTrigger.milestone = this.triggerFormGroup.get('milestone').value;
        this.currentTrigger.generationOffset = this.triggerFormGroup.get('offset').value;
        this.dialogRef.close(this.currentTrigger);
    }
}