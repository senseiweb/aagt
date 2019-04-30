import { AbstractControl, Validators, ValidatorFn } from '@angular/forms';
import {
    DataMembers,
    SpDataDef,
    SpEntityDef,
    SpNavDef
} from '@ctypes/breeze-type-customization';
import {
    MxmAppName,
    MxmAssignedModels,
    SpListName
} from 'app/app-config.service';
import {
    ComplexType,
    DataType,
    EntityType,
    MetadataStore,
    Validator
} from 'breeze-client';

import { SpEntityBase } from './_entity-base';

type knownShortName = keyof typeof SpListName;

export function BzEntity(
    forAppNamed: MxmAppName,
    entityProps: {
        shortName: knownShortName | '__metadata';
        isComplexType?: boolean;
        namespace?: string;
    }
): ClassDecorator {
    return constructor => {
        if (constructor.name !== 'SpEntityBase') {
            const modelCollection = MxmAssignedModels.has(forAppNamed)
                ? MxmAssignedModels.get(forAppNamed)
                : [];
            modelCollection.push(constructor);
            MxmAssignedModels.set(forAppNamed, modelCollection);
        }

        constructor.prototype._createTypeInStore = (store: MetadataStore) => {
            const typeDef = {
                dataProperties: {},
                navigationProperties: {},
                namespace: undefined
            };

            const selectStatement = [];

            copyDataProps(
                typeDef,
                constructor.prototype._bzDataProps,
                constructor.prototype._bzNavProps,
                selectStatement
            );

            if (entityProps.namespace) {
                typeDef.namespace = entityProps.namespace;
            }

            const type = entityProps.isComplexType
                ? new ComplexType(typeDef as any)
                : new EntityType(typeDef as any);

            type.custom = type.custom
                ? (type.custom.defaultSelect = selectStatement.join(','))
                : ({ defaultSelect: selectStatement.join(',') } as any);

            store.addEntityType(type);

            if (!entityProps.isComplexType) {
                store.setEntityTypeForResourceName(
                    entityProps.shortName,
                    type as EntityType
                );
            }

            setValidations(
                type as EntityType,
                constructor.prototype.bzValidator
            );
        };

        constructor.prototype.defaultResourceName = `web/lists/getByTitle('${
            entityProps.shortName
        }')/items`;

        constructor.prototype._makeNameingDict = makeNamingDictionary;

        constructor.prototype._removeBzSetupFramework = () => {
            delete constructor.prototype.defaultResourceName;
            delete constructor.prototype._bzDataProps;
            delete constructor.prototype._createTypeInStore;
        };
    };
}

function copyDataProps(
    typeDef: { dataProperties: {}; navigationProperties: {} },
    dataProps: Map<string, Partial<SpDataDef>>,
    navProps: Map<string, Partial<SpDataDef>>,
    selectStatement: string[]
) {
    dataProps.forEach((dpValue, dpKey) => {
        if (dpKey !== '__metadata') {
            selectStatement.push(dpKey);
        }
        typeDef.dataProperties[dpKey] = dpValue;
    });

    navProps.forEach((dpValue, dpKey) => {
        typeDef.navigationProperties[dpKey] = dpValue;
    });
}

function setValidations(etType: EntityType, bzValidators: IBzValidators) {
    etType.dataProperties.forEach(dp => {
        const dt = dp.dataType as any;
        const validateCtor =
            !dt || dt === DataType.String ? null : dt.validatorCtor;

        if (validateCtor) {
            const validator = validateCtor();
            const exists = dp.validators.some(
                val => val.name === validator.name
            );
            if (!exists) {
                dp.validators.push(validator);
            }
            const validators = bzValidators[dp.name]
                ? bzValidators[dp.name]
                : [];
            validators.push(bzValidatorWrapper(validator));
        }

        const propWithValidation = Object.keys(bzValidators);

        const hasEntityLevelValidation = propWithValidation.includes('entity');

        if (hasEntityLevelValidation) {
            const validators = bzValidators['entity'].entityValidators;
            validators.forEach(val => {
                if (etType.validators.some(val.name)) {
                    return;
                }
                etType.validators.push(val);
            });
        }
        debugger;

        const hasPropLevelValidatio = propWithValidation.includes(dp.name);
        if (hasPropLevelValidatio) {
            const validators = bzValidators[dp.name].entityValidators;
            validators.forEach(val => {
                if (dp.validators.some(val.name)) {
                    return;
                }
                dp.validators.push(val);
            });
        }
    });
}

interface IBzDataPropDecorator {
    _bzDataProps: Map<string, Partial<SpDataDef>>;
}

interface IBzEntityPropDecorator {
    _bzDataProps: Map<string, Partial<SpDataDef>>;
    _bzNavProps: Map<string, Partial<SpNavDef<any>>>;
    _makeNameingDict: (namespace: string, customDictionary: ICustomNameDictionary, entity: SpEntityDecorator) => ICustomNameDictionary;
    _createTypeInStore: (store: MetadataStore) => void;
    // Naming Dictionary SpListName:#Namespace:{propName: spInternalName}
    _bzNamingDict: Map<string, { [key: string]: string }>;
}

export type SpEntityDecorator = SpEntityBase &
    Partial<IBzEntityPropDecorator> &
    Partial<IBzValidators>;

export interface IBzValidators {
    bzValidator?: {
        [index: string]: {
            entityValidators: Validator[];
            formValidators: Validators[];
        };
    };
}

interface IBzNavPropDecorator<T> {
    foreignKeyName?: keyof T;
}

export function BzDataProp(props?: Partial<SpDataDef>): PropertyDecorator {
    return (target: SpEntityDecorator, key: string) => {
        target._bzDataProps = target._bzDataProps || new Map();

        props = props || {};

        if (props.spInternalName) {
            target._bzNamingDict = target._bzNamingDict || new Map();

            const nameDictKey = target.constructor.name;

            if (target._bzNamingDict.has(nameDictKey)) {
                const dictProp = target._bzNamingDict.get(nameDictKey);
                dictProp[key] = props.spInternalName;
            } else {
                target._bzNamingDict.set(`${nameDictKey}:#`, {
                    [key]: props.spInternalName
                });
            }
        }

        // @ts-ignore
        const propType = Reflect.getMetadata('design:type', target, key).name;
        // const propType = undefined;

        if (!props.dataType) {
            switch (propType.toLowerCase()) {
                case 'string':
                    props.dataType = DataType.String;
                    break;
                case 'number':
                    props.dataType = DataType.Int16;
                    break;
                case 'boolean':
                    props.dataType = DataType.Boolean;
                    break;
                case 'date':
                    props.dataType = DataType.DateTime;
                    break;
                default:
                    throw new Error(`Datatype ${propType} unknown or missing on Entity ${target.constructor.name}`);
            }
        }

        target._bzDataProps.set(key, props);
    };
}

// rt = reflective type
export function BzNavProp<T>(meta: { rt: string, fk?: keyof T}): PropertyDecorator {
    return (target: SpEntityDecorator, key: string) => {
        target._bzNavProps = target._bzNavProps || new Map();

        // const foreignTypeName = undefined;
        const navProp: Partial<SpNavDef<any>> = {
            entityTypeName: meta.rt
        };

        navProp.isScalar = !!meta.fk;

        navProp.associationName = navProp.isScalar
            ? `${meta.rt}_${target.constructor.name}`
            : `${target.constructor.name}_${meta.rt}`;

        if (navProp.isScalar) {
            navProp.foreignKeyNames = [meta.fk];
        }

        target._bzNavProps.set(key, navProp);
    };
}

// export function BzNavProp<T>(props: IBzNavPropDecorator<T>): PropertyDecorator {
//     return (target: SpEntityDecorator, key: string) => {
//         target._bzNavProps = target._bzNavProps || new Map();
//         debugger;
//         const foreignTypeName = Reflect.getMetadata('design:type', target, key)
//             .name;

//         const navProp: Partial<SpNavDef<any>> = {
//             entityTypeName: foreignTypeName
//         };

//         navProp.isScalar = !!props.foreignKeyName;

//         navProp.associationName = navProp.isScalar
//             ? `${foreignTypeName}_${target.constructor.name}`
//             : `${target.constructor.name}_${foreignTypeName}`;

//         if (navProp.isScalar) {
//             navProp.foreignKeyNames = [props.foreignKeyName];
//         }

//         target._bzNavProps.set(key, navProp);
//     };
// }

export function BzValid_IsRequired(target: SpEntityDecorator, key: string) {
    target.bzValidator = target.bzValidator || {};

    const validatorList = (target.bzValidator[key] = target.bzValidator[
        key
    ] || {
        formValidators: [],
        entityValidators: []
    });

    validatorList.entityValidators.push(Validator.required());
    validatorList.formValidators.push(Validators.required);
}

export function BzValid_Maxlength(length: number): PropertyDecorator {
    return (target: SpEntityDecorator, key: string) => {
        target.bzValidator = target.bzValidator || {};

        const validatorList = (target.bzValidator[key] = target.bzValidator[
            key
        ] || {
            formValidators: [],
            entityValidators: []
        });

        validatorList.entityValidators.push(
            Validator.maxLength({ maxLength: length })
        );
        validatorList.formValidators.push(Validators.maxLength(length));
    };
}

export function BzValid_CustomValidator<T>(
    propertyTarget?: keyof T
): MethodDecorator {
    return (
        target: any,
        key: string,
        descriptor: TypedPropertyDescriptor<any>
    ) => {
        debugger;
        target.bzValidator = target.bzValidator || {};

        const valProp = propertyTarget || 'entity';

        const validatorList = (target.bzValidator[valProp] = target.bzValidator[
            valProp
        ] || {
            formValidators: [],
            entityValidators: []
        });

        validatorList.entityValidators.push(target[key]);
        validatorList.formValidators.push(bzValidatorWrapper(target[key]));
    };
}

function bzValidatorWrapper(validator: Validator): ValidatorFn {
    return (c: AbstractControl): { [error: string]: any } => {
        const result = validator.validate(c.value, validator.context);
        return result ? { [result.propertyName]: result.errorMessage } : null;
    };
}
interface ICustomNameDictionary {
    [index: string]: {
        [index: string]: string;
    }
}
function makeNamingDictionary(namespace: string, customDictionary: ICustomNameDictionary, entity: SpEntityDecorator): ICustomNameDictionary {
    if (!entity._bzNamingDict) {
        return customDictionary;
    }
    const keys = entity._bzNamingDict.keys();
    for (const key of keys) {
        const dictKey = key + namespace;
        const dictProp = entity._bzNamingDict.get(key);
        if (customDictionary[dictKey]) {
            Object.assign(customDictionary[dictKey], dictProp);
        } else {
            const newEntry = { [dictKey]: dictProp };
            Object.assign(customDictionary, newEntry);
        }
    }
    return customDictionary;
}
