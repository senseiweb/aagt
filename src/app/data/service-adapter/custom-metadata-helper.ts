import { Injectable } from '@angular/core';
import {
    config,
    AutoGeneratedKeyType,
    DataType,
    Validator,
    MetadataStore,
    DataService,
    DataProperty,
    EntityType,
    ComplexType

} from 'breeze-client';
import { TypeDefintion } from './custom-type-def';

@Injectable({ providedIn: 'root' })
export class CustomMetadataHelperService {

    defaultNamespace: string;
    defaultAutoGenKeyType: AutoGeneratedKeyType;

    constructor() { }

    addDataService(store: MetadataStore, serviceName: string): void {
        store.addDataService(new DataService({ serviceName: serviceName }));
    }

    /**
     * Create the type from the definition hash and add the type to the store
     * fixes some defaults, infers certain validators,
     * add adds the type's "shortname" as a resource name
     */
    addTypeToStore(store: MetadataStore, typeDef: TypeDefintion<any>): EntityType | ComplexType {
        typeDef.checkForName()
            .setNamespace(this.defaultNamespace)
            .inferDefaultResourceName()
            .findEntityKey()
            .hasAKeyType(this.defaultAutoGenKeyType)
            .replaceDataPropAliases()
            .replaceNavPropAliases();

        const type = typeDef.isComplexType ?
            new ComplexType(typeDef as any) :
            new EntityType(typeDef as any);

        store.addEntityType(type);
        this.inferValidators(type);
        this.addTypeNameAsResource(store, type as EntityType);
        return type;
    }

    // Often helpful to have the type's 'shortName' available as a resource name
    // as when composing a query to be executed locally against the cache.
    // This function adds the type's 'shortName' as one of the resource names for the type.
    // Theoretically two types in different models could have the same 'shortName'
    // and thus we would associate the same resource name with the two different types.
    // While unlikely, breeze should offer a way to remove a resource name for a type.
    addTypeNameAsResource(store: MetadataStore, type: EntityType) {
        if (!type.isComplexType) {
            store.setEntityTypeForResourceName(type.shortName, type);
        }
    }


    private inferValidators(entityType: EntityType | ComplexType): void {

        entityType.dataProperties.forEach(prop => {
            if (!prop.isNullable) { // is required.
                this.addValidator(prop, Validator.required());
            }

            this.addValidator(prop, this.getDataTypeValidator(prop));

            if (prop.maxLength != null && prop.dataType === DataType.String) {
                this.addValidator(prop, Validator.maxLength({ maxLength: prop.maxLength }));
            }

        });
    }

    addValidator(prop: DataProperty, validator: Validator): void {
        if (!validator) { return; } // no validator arg
        const valName = validator.name;
        const validators = prop.validators;
        const found = validators.filter(function (val) { return val.name == valName; });
        if (!found.length) { // this validator has not already been specified
            validators.push(validator);
        }
    }

    getDataTypeValidator(prop: DataProperty): Validator {
        const dataType = prop.dataType as any;
        const validatorCtor = !dataType || dataType === DataType.String ? null : dataType.validatorCtor;
        return validatorCtor ? validatorCtor() : null;
    }

}
