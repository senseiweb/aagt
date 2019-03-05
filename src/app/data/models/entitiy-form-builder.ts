import {
  FormBuilder,
  AbstractControl,
  FormArray,
    AbstractControlOptions,
  FormGroup
} from '@angular/forms';

import {
    // FormGroup,
    FormControl
} from '@angular/forms/src/model';

import { Observable } from 'rxjs';

import { Entity } from 'breeze';
import { Omit, bareEntity } from './_entity-base';

export interface EntityAbstractControl<T = Entity> extends AbstractControl {
    readonly valueChanges: Observable<T>;
    readonly value: T;
    setValue(value: T, options?: Object): void;
    get<K extends keyof T>(path: K): AbstractControl;
    get<S>(path: (string | number)[]): AbstractControl;
    get(path: (string | number)[]): AbstractControl;
}

  export interface EntityFormControl<T> extends FormControl {
    readonly valueChanges: Observable<T>;
    readonly value: T;
    setValue(value: T, options?: Object): void;
    get<K extends keyof T>(path: K): EntityAbstractControl<T[K]>;
    get<S>(path: (string | number)[]): EntityAbstractControl<S>;
    get(path: (string | number)[]): EntityAbstractControl<any>;
  }

// export interface EntityFormGroup<T = Entity> extends FormGroup {
//     readonly controls: { [P in keyof T]: EntityAbstractControl<T[P]> };
//     // readony valueChanges: Observable<T>;
//     // readonlly value: T;
//     // get<K extends keyof T>(path: K): EntityAbstractControl<T[K]>;
//     // get<S>(path: (string | number)[]): EntityAbstractControl<S>;
//     // get(path: (string | number)[]): EntityAbstractControl<any>;
//     // setValue(value: T, options?: Object): void;
//     // patchValue(value: T, options?: Object): void;
//     // getRawValue(): T;
// }

  export interface EntityFormArray<T = Entity> extends FormArray {
    readonly valueChanges: Observable<T[]>;
    readonly value: T[];
    push(control: EntityAbstractControl<T>): void;
    insert(index: number, control: EntityAbstractControl<T>): void;
    setValue(value: T[], options?: Object): void;
    patchValue(value: T[], options?: Object): void;
    getRawValue(): T[];
  }
export declare type AugmentedFormGroup = Omit<FormGroup, 'get' | 'controls'>;
export interface EntityFormGroup<T> extends AugmentedFormGroup {
    controls: {
        [key in keyof bareEntity<T>]: AbstractControl;
    };
    get(path: Array<keyof bareEntity<T>> | keyof bareEntity<T>): AbstractControl | null;
}

// export declare class EntityFormBuilder<T> extends FormBuilder {
//     group(controlsConfig: { [key in keyof bareEntity<T>]: any },
//         options?: AbstractControlOptions |
//         {
//             [key: string]: any;
//         } | null): FormGroup;
// }

export declare type AugmentedFormBuilder = Omit<FormBuilder, 'group'>;
export interface EntityFormBuilder<T> extends AugmentedFormBuilder {
    group(controlsConfig: { [key in keyof bareEntity<T>]: any }, options?: AbstractControlOptions | {
        [key: string]: any;
    } | null): FormGroup;
}