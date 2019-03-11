import { SpMetadata } from './sp-metadata';
import {
    DataType,
    DataProperty,
    Entity,
    EntityAspect,
    EntityType,
    NavigationProperty,
} from 'breeze-client';
import { TypeDefintion } from '../service-adapter/custom-type-def';

export type Instantiable<T> = new(...args: any[]) => T;

// export declare type Children<T> <keyof T, T extends any[] ? T : never;

export declare type FilterType<T, U> = { [key in keyof T]: T extends U ? key : never }

export declare type FilterEntityCollection<T> = keyof Partial<Pick<T,
    { [K in keyof T]: T[K] extends Array<Entity> ? K : never }[keyof T]>>;

export declare type EntityChildren<T> = Extract<FilterEntityCollection<T>, string>;

// export declare type ChildrenPropws<T> = keyof Partial<Pick<T, {
//         [K in keyof T]: Array<Entity> extends T[K] ? K : never;
//        }[keyof T]>>;

export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

declare type ExtreBareEntityProps = 'entityType' | 'entityAspect' | 'entityDefinition' | '$typeName';

export declare type bareEntity<T> = Partial<Pick<T, Exclude<keyof T, keyof Entity | ExtreBareEntityProps>>>;

export declare type CustomEtDef = Omit<EntityType, 'dataProperties'|'navigationProperties'>;

declare type dtDef = Omit<DataProperty, 'dataType'>;

declare type navDef = Omit<NavigationProperty, 'foreignKeyNames'>;

export interface SpDataDef extends dtDef {
    dataType: DataType;
    hasMany?: boolean;
}
export interface SpNavDef<T> extends navDef {
    foreignKeyNames?: Array<keyof bareEntity<T>>;
}
export type DataMembers<T> = {
    [key in keyof bareEntity<T>]: Partial<SpDataDef>;
};

// export interface Type<T> extends Function {
//     new (...args: any[]): T;
// }
export type ClientNameDict<T> = {
    [bkey in keyof bareEntity<T>]: string
};
export type NavMembers<T> = {
    [key in keyof bareEntity<T>]: Partial<SpNavDef<T>>;
};
export interface SpEntityDef<T> extends Partial<CustomEtDef> {
    dataProperties?: DataMembers<T>;
    isComplexType?: boolean;
    navigationProperties?: NavMembers<T>;
}

export class SpEntityBase implements Entity {
    // sharepoint includes this property but we dont use it;
    iD: number;
    entityAspect: EntityAspect;
    entityType: EntityType;
    id: number;
    modified: Date;
    created: Date;
    authorId: number;
    editorId: number;
    __metadata?: SpMetadata;
    // get $typeName(): string {
    //     if (!this.entityAspect) {return; }
    //     return this.entityType.shortName;
    // }
}

export class MetadataBase<T> {

    protected dt = DataType;

    protected baseDataProperties: DataMembers<SpEntityBase> = {
        id: {
            dataType: this.dt.Int32,
            isPartOfKey: true,
        },
        '__metadata': {
            complexTypeName: '__metadata',
            dataType: null,
            isNullable: false
        },
        modified: { dataType: this.dt.DateTime },
        created: { dataType: this.dt.DateTime },
        authorId: { dataType: this.dt.Int32 },
        editorId: { dataType: this.dt.Int32 }
    };

    entityDefinition = new TypeDefintion<T>();
    
    metadataFor: Instantiable<T>;

    translateDictionary = {} as {
        isUsed: boolean;
        name: string;
        dict: Array<ClientNameDict<T>>
    };

    constructor(shortName: string) {
        this.entityDefinition.shortName = shortName;
        this.translateDictionary.isUsed = false;
        this.translateDictionary.name = shortName;
        this.entityDefinition.defaultResourceName = `lists/getByTitle('${shortName}')/items`;
    }

    addDefaultSelect(type: EntityType): EntityType {
        const customProp = type.custom;
        const excludeProps = ['__metadata'];

        if (type.isComplexType) {
            return;
        }

        if (!customProp || !customProp['defaultSelect']) {
            const selectItems = [];
            type.dataProperties.forEach((prop) => {
                const isExcluded = excludeProps.some(exProp => exProp === prop.name);
                if (!prop.isUnmapped && !isExcluded) { selectItems.push(prop.name); }
            });
            if (selectItems.length) {
                if (!customProp) {
                    type.custom = {};
                }
                type.custom = { defaultSelect: selectItems.join(',') };
            }
        }
        return type;
    }

    initializer(_entity: T) { }

    
  
}

