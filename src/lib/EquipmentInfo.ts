import { t } from 'ttag';
import { Point } from 'geojson';

import { FeatureCollection, YesNoLimitedUnknown } from './Feature';
import { currentLocales, translatedStringFromObject } from './i18n';

export type CategoryString =
  | 'elevator'
  | 'escalator'
  | 'switch'
  | 'sitemap'
  | 'vending-machine'
  | 'intercom'
  | 'power-outlet';

export const CategoryStrings: CategoryString[] = [
  'elevator',
  'escalator',
  'switch',
  'sitemap',
  'vending-machine',
  'intercom',
  'power-outlet',
];

export type DisruptionProperties = {
  originalId?: string;
  originalEquipmentInfoId?: string;
  originalEquipmentInfoIdField?: string;
  equipmentInfoId?: string;
  originalPlaceInfoId?: string;
  originalPlaceInfoIdField?: string;
  placeInfoId?: string;
  sourceId?: string;
  sourceImportId?: string;
  category?:
    | 'elevator'
    | 'escalator'
    | 'switch'
    | 'sitemap'
    | 'vending-machine'
    | 'intercom'
    | 'power-outlet';
  isEquipmentWorking?: boolean;
  stateExplanation?: string;
  outOfOrderReason?: string;
  alternativeRouteInstructions?: string;
  startDate?: string;
  plannedCompletionDate?: string;
  lastUpdate?: string;
};

export type EquipmentInfoProperties = {
  _id: string;
  originalId?: string;
  originalPlaceInfoId?: string;
  disruptionSourceImportId?: string;
  originalData?: string;
  placeInfoId?: string;
  sourceId?: string;
  sourceImportId?: string;
  category?: CategoryString;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  accessibility: {
    hasRaisedText?: boolean;
    isBraille?: boolean;
    hasSpeech?: boolean;
    isHighContrast?: boolean;
    hasLargePrint?: boolean;
    isVoiceActivated?: boolean;
    hasHeadPhoneJack?: boolean;
    isEasyToUnderstand?: boolean;
    hasDoorsInBothDirections?: boolean;
    heightOfControls?: number;
    doorWidth?: number;
    cabinWidth?: number;
    cabinLength?: number;
  };
  isWorking?: boolean;
  stateLastUpdate?: string;
  lastUpdate?: string;
  lastDisruptionProperties?: DisruptionProperties;
};

export type EquipmentInfo = {
  type: 'Feature';
  geometry: Point;
  properties: EquipmentInfoProperties;
};

export type EquipmentInfoFeatureCollection = FeatureCollection<EquipmentInfo>;

export function equipmentStatusTitle(isWorking: boolean, isOutdated: boolean) {
  return {
    // translator: An equipment or facility status. The facility might be an elevator, escalator, switch, sitemap, …
    true: t`In operation`,
    // translator: An equipment or facility status. This does not mean the facility is broken: It might just be in maintenance! The facility might be an elevator, escalator, switch, sitemap, …
    false: t`Out of order`,
    // translator: An equipment or facility status. The facility might be an elevator, escalator, switch, sitemap, …
    undefined: t`Unknown operational status`,
  }[String(isOutdated ? undefined : isWorking)];
}

export function isExistingInformationOutdated(lastUpdate: Date | undefined): boolean {
  if (!lastUpdate) return false;
  const twoHoursInMilliseconds = 1000 * 60 * 60 * 2;
  return new Date().getTime() - lastUpdate.getTime() > twoHoursInMilliseconds;
}

export function isEquipmentAccessible(
  properties: EquipmentInfoProperties | undefined
): YesNoLimitedUnknown | null {
  if (!properties) {
    return null;
  }

  const lastUpdateString = properties.stateLastUpdate || properties.lastUpdate || properties.lastDisruptionProperties?.lastUpdate;
  const lastUpdate = lastUpdateString ? new Date(lastUpdateString) : null;
  const isOutdated = isExistingInformationOutdated(lastUpdate);
  return {
    true: 'yes' as YesNoLimitedUnknown,
    false: 'no' as YesNoLimitedUnknown,
    undefined: 'unknown' as YesNoLimitedUnknown,
  }[String(isOutdated ? undefined : properties.isWorking)];
}

export function lastUpdateString({
  lastUpdate,
  isWorking,
  category,
  isOutdated,
}: {
  lastUpdate: Date | null;
  isWorking: boolean | undefined;
  category: string | null;
  isOutdated: boolean;
}) {
  if (!lastUpdate) {
    // translator: Shown next to equipment status when the system does not know a last update.
    return `Unfortunately there is no information when this status was last updated.`;
  }

  const translatedEquipmentCategory = {
    escalator: t`Escalator`,
    elevator: t`Elevator`,
    // translator: An equipment or facility whose category we don't know. It might be an elevator, escalator, switch, sitemap, …
    undefined: t`Facility`,
  }[String(category)];

  const now = new Date();
  const today = t`today`;
  const yesterday = t`yesterday`;
  const twoDaysInMilliseconds = 2 * 24 * 60 * 60 * 1000;
  const isShortAgo = now.getTime() - lastUpdate.getTime() < twoDaysInMilliseconds;
  const isToday = isShortAgo && lastUpdate.getDay() === now.getDay();
  const fullDateOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  let dateString = lastUpdate.toLocaleDateString(
    currentLocales.map(l => l.string),
    fullDateOptions
  );
  if (isExistingInformationOutdated(lastUpdate) && typeof isWorking !== 'undefined') {
    const lastStatus = equipmentStatusTitle(isWorking, false);
    // translator: Shown for equipment when the last known status information is too old.
    return t`Last known operational status: ${translatedEquipmentCategory} was ${lastStatus} on ${dateString}.`;
  } else {
    if (isShortAgo) {
      const timeOptions = { hour: '2-digit', minute: '2-digit' };
      dateString = `${isToday ? today : yesterday}, ${lastUpdate.toLocaleTimeString(
        currentLocales.map(l => l.string),
        timeOptions
      )}`;
    }
    // translator: Shown next to equipment status.
    return t`Last update: ${dateString}`;
  }
}
