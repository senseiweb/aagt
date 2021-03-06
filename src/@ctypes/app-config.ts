import { FormControl } from '@angular/forms';
import {
    ActionItem,
    Asset,
    AssetTriggerAction,
    Assumption,
    Generation,
    GenerationAsset,
    Team,
    TeamAvailability,
    TeamCategory,
    Trigger,
    TriggerAction
} from 'app/features/aagt/data';
import { TeamJobReservation } from 'app/features/aagt/data/models/team-job-reservation';
import { SpEntityBase } from 'app/global-data';
import { Omit, RawEntity, Unarray } from './breeze-type-customization';

export declare class IAppConfig {
    static aggtFeatureAppSite: string;
    static sharepointMainAppSite: string;
    static webApplicationSite: string;
}

/**
 * @enumerable decorator that sets the enumerable property of a class field to false.
 * @param value true|false
 */
export function enumerable(value: boolean) {
    return (target: any, propertyKey: string) => {
        const descriptor =
            Object.getOwnPropertyDescriptor(target, propertyKey) || {};
        if (descriptor.enumerable !== value) {
            descriptor.enumerable = value;
            descriptor.writable = true;
            descriptor.configurable = true;
            Object.defineProperty(target, propertyKey, descriptor);
        }
    };
}

export type SpEntityOfType = SpListEntities['shortname'];

export type CompleteEntity<T> = { [P in keyof T]-?: T[P] };

export type SpFormProps<T extends SpEntityBase> = Extract<
    keyof Partial<RawEntity<Omit<T, 'shortname'>>>,
    string
>;

export type SpFormModel<T extends Array<SpFormProps<any>>> = {
    [index in Unarray<T>]?: FormControl
};

// export type MapDiscriminatedUnion<
//     T extends Record<keyof typeof SpListName, string>,
//     K extends keyof T
// > = { [V in T[K]]: DiscriminateUnion<T, K, V> };

// export type DiscriminateUnion<
//     T,
//     K extends keyof T,
//     V extends T[K]
// > = T extends Record<K, V> ? T : never;

/**
 * A union type that represents that Sp List
 * names to which they are associated.
 * They list name should match exacty to ensure'
 * that query operations are correct.
 */
export type SpListEntities =
    | ActionItem
    | AssetTriggerAction
    | Asset
    | Assumption
    | GenerationAsset
    | Generation
    | TeamAvailability
    | TeamCategory
    | TeamJobReservation
    | Team
    | TriggerAction
    | Trigger;

export interface ISpUserGroup {
    groupId: string;
    groupName: string;
}

export interface ISPUserProfileProperties {
    UserProfile_GUID?: string;
    SID?: string;
    ADGuid?: string;
    // ex: AREA52\\1065318454
    AccountName?: string;
    FirstName?: string;
    'SPS-PhoneticFirstName'?: string;
    LastName?: string;
    'SPS-PhoneticLastName'?: string;
    // ex: LAST, FIRST MI RANK USAF MAJCOM OFFICE
    PreferredName?: string;
    'SPS-PhoneticDiSPlayName'?: string;
    WorkPhone?: string;
    // ex: MAJCOM (AFGSC)
    Department?: string;
    // ex: Duty Title
    Title?: string;
    'SPS-JobTitle'?: string;
    'SPS-Department'?: string;
    Manager?: string;
    AboutMe?: string;
    // ex:/personal/1065318454
    PersonalSpace?: string;
    PictureURL?: string;
    // ex: 1065318454A
    UserName?: string;
    QuickLinks?: string;
    WebSite?: string;
    PublicSiteRedirect?: string;
    'SPS-DataSource'?: string;
    'SPS-MemberOf'?: string;
    'SPS-Dotted-line'?: string;
    'SPS-Peers'?: string;
    'SPS-Responsibility'?: string;
    // ex: johnny.lockhart@us.af.mil
    'SPS-SipAddress'?: string;
    'SPS-MySiteUpgrade'?: string;
    'SPS-DontSuggestList'?: string;
    'SPS-ProxyAddresses'?: string;
    'SPS-HireDate'?: string;
    'SPS-DisplayOrder'?: string;
    // ex: 1065318454A
    'SPS-ClaimID'?: string;
    // ex: Windows
    'SPS-ClaimProviderID'?: string;
    'SPS-ClaimProviderType'?: string;
    'SPS-LastColleagueAdded'?: string;
    'SPS-OWAUrl'?: string;
    'SPS-SavedAccountName'?: string;
    'SPS-SavedSID'?: string;
    'SPS-ResourceSID'?: string;
    'SPS-ResourceAccountName'?: string;
    'SPS-ObjectExists'?: string;
    'SPS-MasterAccountName'?: string;
    // ex: 1065318454@mil
    'SPS-UserPrincipalName'?: string;
    'SPS-PersonalSiteCapabilities'?: string;
    'SPS-O15FirstRunExperience'?: string;
    'SPS-PersonalSiteInstantiationState'?: string;
    'SPS-DistinguishedName'?: string;
    'SPS-SourceObjectDN'?: string;
    'SPS-LastKeywordAdded'?: string;
    'SPS-FeedIdentifier'?: string;
    WorkEmail?: string;
    CellPhone?: string;
    Fax?: string;
    HomePhone?: string;
    Office?: string;
    'SPS-Location'?: string;
    Assistant?: string;
    'SPS-PastProjects'?: string;
    'SPS-Skills'?: string;
    'SPS-School'?: string;
    'SPS-Birthday'?: string;
    'SPS-StatusNotes'?: string;
    'SPS-Interests'?: string;
    'SPS-HashTags'?: string;
    'SPS-PictureTimestamp'?: string;
    'SPS-EmailOptin'?: string;
    'SPS-PicturePlaceholderState'?: string;
    'SPS-PrivacyPeople'?: string;
    'SPS-PrivacyActivity'?: string;
    'SPS-PictureExchangeSyncState'?: string;
    'SPS-MUILanguages'?: string;
    'SPS-ContentLanguages'?: string;
    'SPS-TimeZone'?: string;
    'SPS-RegionalSettings-FollowWeb'?: string;
    'SPS-Locale'?: string;
    'SPS-CalendarType'?: string;
    'SPS-AltCalendarType'?: string;
    'SPS-AdjustHijriDays'?: string;
    'SPS-ShowWeeks'?: string;
    'SPS-WorkDays'?: string;
    'SPS-WorkDayStartHour'?: string;
    'SPS-WorkDayEndHour'?: string;
    'SPS-Time24'?: string;
    'SPS-FirstDayOfWeek'?: string;
    'SPS-FirstWeekOfYear'?: string;
    'SPS-RegionalSettings-Initialized'?: string;
}
