import { Validators, ValidatorFn } from '@angular/forms';
import { SpDataDef, SpNavDef } from '@ctypes/breeze-type-customization';
import {
    MxmAppName,
    MxmAssignedModels,
    SpListName
} from 'app/app-config.service';
import {
    AutoGeneratedKeyType,
    ComplexType,
    DataType,
    EntityType,
    MetadataStore,
    Validator
} from 'breeze-client';
import { IBreezeNgValidator, SpEntityBase } from '../_entity-base';
import { bzValidatorWrapper } from './breeze-validation';

export type SpEntityDecorator = SpEntityBase &
    Partial<IBzEntityPropDecorator> &
    Partial<IBzValidators>;

interface IBzEntityPropDecorator {
    _bzDataProps: Map<string, Partial<SpDataDef>>;
    _bzNavProps: Map<string, Partial<SpNavDef<any>>>;
    _bzDefaultSelect: string[];
    _makeNameingDict: (
        namespace: string,
        customDictionary: ICustomNameDictionary,
        entity: SpEntityDecorator
    ) => ICustomNameDictionary;
    _createTypeInStore: (store: MetadataStore) => void;
    // Naming Dictionary SpListName:#Namespace:{propName: spInternalName}
    _bzNamingDict: Map<string, { [key: string]: string }>;
}

interface ICustomNameDictionary {
    [index: string]: {
        [index: string]: string;
    };
}

export interface IBzValidators {
    frmValidator?: Map<string, ValidatorFn[]>;
    etValidator?: Map<string, Validator[]>;
}

const copyDataProps = (
    typeDef: { dataProperties: {}; navigationProperties?: {} },
    targetConstructor: Function,
    entityProps: {
        shortName: keyof typeof SpListName | '__metadata';
        isComplexType?: boolean;
        namespace?: string;
    }
): string[] => {
    const dataProps: Map<string, Partial<SpDataDef>> =
        targetConstructor.prototype._bzDataProps || [];

    const navProps: Map<string, Partial<SpDataDef>> =
        targetConstructor.prototype._bzNavProps || [];

    // dataProps.delete('spInternalName');

    dataProps.forEach((dpValue, dpKey) => {
        const propTypeName = dpValue['complexTypeName'];

        if (propTypeName) {
            // append the namespace to entityTypeName if missing
            const nsStart = propTypeName && propTypeName.indexOf(':#');

            if (nsStart === -1) {
                // name is unqualified; append the namespace
                dpValue['complexTypeName'] += ':#' + entityProps.namespace;
            }
        }

        typeDef.dataProperties[dpKey] = dpValue;
    });

    navProps.forEach((dpValue, dpKey) => {
        let propTypeName = dpValue['entityTypeName'];

        // append the namespace to entityTypeName if missing
        const nsStart = propTypeName.indexOf(':#');
        if (nsStart === -1) {
            // name is unqualified; append the namespace
            dpValue['entityTypeName'] += ':#' + entityProps.namespace;
        } else {
            propTypeName = propTypeName.slice(0, nsStart);
        }

        typeDef.navigationProperties[dpKey] = dpValue;
    });

    // if (entityProps.isComplexType) {
    //     delete typeDef.navigationProperties;
    //     return typeDef;
    // }
    const baseEntityProps = Object.getPrototypeOf(targetConstructor);
    let parentDefaultSelect: string[];
    if (
        baseEntityProps &&
        baseEntityProps.prototype &&
        baseEntityProps.prototype._bzDataProps
    ) {
        baseEntityProps.prototype._bzDataProps.forEach((dpValue, dpKey) => {
            typeDef.dataProperties[dpKey] = dpValue;
        });

        parentDefaultSelect = baseEntityProps.prototype._bzDefaultSelect;
    }

    const targetDefaultSelect = targetConstructor.prototype._bzDefaultSelect;

    return parentDefaultSelect
        ? targetDefaultSelect.concat(parentDefaultSelect)
        : targetDefaultSelect;
};

const setValidations = (
    etType: EntityType,
    frmValidator: Map<string, ValidatorFn[]>,
    etValidator: Map<string, Validator[]>,
    finalFrmValidators: Map<string, ValidatorFn[]>
): Map<string, ValidatorFn[]> => {
    etType.dataProperties.forEach(dp => {
        let finalFormValidatorsForProp = finalFrmValidators.get(dp.name) || [];
        const dt = dp.dataType as any;

        // add validators that breeze auto finds based on datatype, then
        // push them into the data property and in the form validation
        const validateCtor =
            !dt || dt === DataType.String ? null : dt.validatorCtor;

        if (validateCtor) {
            const validator = validateCtor();
            const exists = dp.validators.some(
                val => val.name === validator.name
            );

            if (!exists) {
                dp.validators.push(validator);
                finalFormValidatorsForProp.push(bzValidatorWrapper(validator));
            }
        }

        // process props that have validation annotations, take the breeze
        // specific validators, if they are entity level push them into the
        // into the entity.
        const entityLevelValidators = etValidator.get('entity');
        if (entityLevelValidators) {
            entityLevelValidators.forEach(val => {
                if (etType.validators.some(etV => etV.name === val.name)) {
                    return;
                }
                etType.validators.push(val);
            });
        }

        // process props that have validation annotations, take the breeze
        // specific validators,  push them into the into the entity.
        const etValidatorsForProp = etValidator.get(dp.name);

        if (etValidatorsForProp) {
            etValidatorsForProp.forEach(val => {
                if (dp.validators.some(dpv => dpv.name === val.name)) {
                    return;
                }
                dp.validators.push(val);
            });
        }

        // grab the existing formValidators and copy to the final;
        finalFormValidatorsForProp = [
            ...new Set(finalFormValidatorsForProp),
            ...new Set(frmValidator.get(dp.name))
        ];

        if (finalFormValidatorsForProp.length) {
            finalFrmValidators.set(dp.name, finalFormValidatorsForProp);
        }
    });

    return finalFrmValidators;
};

const removedEntityScaffold = (constructor: Function) => {
    delete constructor.prototype.defaultResourceName;
    delete constructor.prototype._bzDataProps;
    delete constructor.prototype._bzNavProps;
    delete constructor.prototype._createTypeInStore;
    delete constructor.prototype._bzNamingDict;
    delete constructor.prototype._bzDefaultSelect;
    delete constructor.prototype._makeNameingDict;
    delete constructor.prototype.initializer;
    delete constructor.prototype.bzValidator;
    delete constructor.prototype.etValidator;
};

const makeNamingDictionary = (
    namespace: string,
    customDictionary: ICustomNameDictionary,
    entity: SpEntityDecorator & Function
): ICustomNameDictionary => {
    if (!entity.prototype._bzNamingDict) {
        return customDictionary;
    }
    const keys = entity.prototype._bzNamingDict.keys();
    for (const key of keys) {
        const dictKey = `${key}:#${namespace}`;
        const dictProp = entity.prototype._bzNamingDict.get(key);
        if (customDictionary[dictKey]) {
            Object.assign(customDictionary[dictKey], dictProp);
        } else {
            const newEntry = { [dictKey]: dictProp };
            Object.assign(customDictionary, newEntry);
        }
    }
    return customDictionary;
};

const createTypeInStore = (
    constructor: Function,
    entityProps: {
        shortName: keyof typeof SpListName | '__metadata';
        isComplexType?: boolean;
        namespace?: string;
    },
    featureNamespace: string,
    store: MetadataStore,
    autoGenKeyType?: AutoGeneratedKeyType
) => {
    const typeDef: {
        shortName: string;
        dataProperties: {};
        navigationProperties?: {};
        defaultResourceName?: string;
        autoGeneratedKeyType: AutoGeneratedKeyType;
        namespace: string;
    } = {
        shortName: entityProps.shortName,
        dataProperties: {},
        namespace: '',
        autoGeneratedKeyType: undefined
    };

    if (!entityProps.isComplexType) {
        typeDef.navigationProperties = {};
    }

    typeDef.namespace = entityProps.namespace =
        entityProps.namespace || featureNamespace;

    const defaultSelect = copyDataProps(typeDef, constructor, entityProps);

    let type: EntityType | ComplexType;

    if (entityProps.isComplexType) {
        type = new ComplexType(typeDef as any);
    } else {
        typeDef.autoGeneratedKeyType =
            autoGenKeyType || AutoGeneratedKeyType.Identity;

        typeDef.defaultResourceName = `web/lists/getByTitle('${
            typeDef.shortName
        }')/items`;

        type = new EntityType(typeDef as any);

        const selectStatement = defaultSelect.join(',');

        type.custom = type.custom
            ? (type.custom['defaultSelect'] = selectStatement)
            : ({ defaultSelect: selectStatement } as any);
    }

    store.addEntityType(type);

    if (!type.isComplexType) {
        store.setEntityTypeForResourceName(
            entityProps.shortName,
            type as EntityType
        );
    }

    const intializer = constructor.prototype.initializer;

    // need to set a default for the case when the base
    // class is being process and contains no validations;
    const frmValidator: Map<string, ValidatorFn[]> =
        constructor.prototype.frmValidator || new Map();

    const etValidator: Map<string, Validator[]> =
        constructor.prototype.etValidator || new Map();

    const formValidators = setValidations(
        type as EntityType,
        frmValidator,
        etValidator,
        new Map()
    );

    if (formValidators.size) {
        if (type.custom) {
            type.custom.formValidators = formValidators;
        } else {
            type.custom = { formValidators };
        }
    }

    removedEntityScaffold(constructor);

    store.registerEntityTypeCtor(type.shortName, constructor, intializer);
};

export const BzEntity = (
    forAppNamed: MxmAppName | 'Global',
    entityProps: {
        shortName: keyof typeof SpListName | '__metadata';
        isComplexType?: boolean;
        namespace?: string;
    }
): ClassDecorator => {
    return constructor => {
        if (constructor.name !== 'SpEntityBase') {
            const modelCollection = MxmAssignedModels.has(forAppNamed)
                ? MxmAssignedModels.get(forAppNamed)
                : [];
            modelCollection.push(constructor);
            MxmAssignedModels.set(forAppNamed, modelCollection);
        }
        constructor.prototype._createTypeInStore = (
            store: MetadataStore,
            namespace: string,
            autoGenKeyType?: AutoGeneratedKeyType
        ) =>
            createTypeInStore(
                constructor,
                entityProps,
                namespace,
                store,
                autoGenKeyType
            );

        constructor.prototype._makeNameingDict = makeNamingDictionary;
    };
};