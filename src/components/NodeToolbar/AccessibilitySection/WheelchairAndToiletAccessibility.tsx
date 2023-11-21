import * as React from 'react';
import includes from 'lodash/includes';
import styled from 'styled-components';
import { msgid, ngettext, t } from 'ttag';
import {
  isWheelchairAccessible,
  hasAccessibleToilet,
  accessibilityName,
  accessibilityDescription,
  toiletDescription,
  isWheelmapFeature,
  normalizedCoordinatesForFeature,
} from '../../../lib/Feature';
import colors from '../../../lib/colors';
import PenIcon from '../../icons/actions/PenIcon';
import { Feature } from '../../../lib/Feature';
import { getCategoryIdFromProperties } from '../../../lib/Categories';
import { YesNoLimitedUnknown, YesNoUnknown } from '../../../lib/Feature';
import ToiletStatusAccessibleIcon from '../../icons/accessibility/ToiletStatusAccessible';
import ToiletStatusNotAccessibleIcon from '../../icons/accessibility/ToiletStatusNotAccessible';
import { geoDistance } from '../../../lib/geoDistance';
import { formatDistance } from '../../../lib/formatDistance';
import AppContext from '../../../AppContext';
import { isParkingFacility } from '../AccessibilityEditor/isA11yEditable';
import { isNumber } from 'lodash';


const isNumericString = (s: string | undefined) => s?.match(/^\d+$/)
const isPositive = (s: string | undefined) => isNumericString(s) && Number(s) >= 1;
const isUndefined = (s: string | undefined) => s === undefined || s === '';
const isYes = (s: string | undefined) => s === 'yes';
const isZeroOrNo = (s: string | undefined) => s === 'no' || s === '0';

export function getAccessDescription(accessTagValue: string) {
  switch(accessTagValue) {
    case 'permissive': return t`This is a private parking facility, but public access is usually allowed.`;
    case 'yes': return t`This is a public parking facility.`;
    case 'permit': return t`You need a permit to park here.`;
    case 'customers': return t`Only customers are allowed to park here.`;
    case 'destination': return t`Only residents are allowed to park here.`;
    default: return null;
  }
}


// Don't incentivize people to add toilet status to places of these categories
const placeCategoriesWithoutExtraToiletEntry = [
  'parking_carports',
  'parking_half_on_kerb',
  'parking_on_kerb',
  'parking_layby',
  'parking_street_side',
  'parking_surface',
  'bus_stop',
  'tram_stop',
  'atm',
  'toilets',
  'elevator',
  'escalator',
  'entrance',
  'subway_entrance',
  'platform',
  'railway_platform',
  'animal',
  'kiosk',
  'other',
  'parcel_locker',
  'pier',
  'recycling',
  'shelter',
  'station_entrance',
  'stop_area',
  'taxi',
  'stop_position',
  'telephone',
  'traffic_signals',
  'tram_crossing',
  'undefined',
  'vending_machine',
];

export function AccessibilityName({ accessibility }: { accessibility: YesNoLimitedUnknown }) {
  const appContext = React.useContext(AppContext);
  const clientSideConfiguration = appContext.app.clientSideConfiguration;
  const description = accessibilityName(accessibility, clientSideConfiguration);

  switch (accessibility) {
    case 'yes':
    case 'limited':
    case 'no':
      return <span>{description}</span>;
    case 'unknown':
    default:
      return null;
  }
}

const toiletIcons = {
  yes: <ToiletStatusAccessibleIcon />,
  no: <ToiletStatusNotAccessibleIcon />,
};

function ToiletDescription(accessibility: YesNoUnknown) {
  if (!accessibility) return;

  // translator: Button caption, shown in the place toolbar
  const editButtonCaption = t`Mark wheelchair accessibility of WC`;
  const description = toiletDescription(accessibility) || editButtonCaption;
  const icon = toiletIcons[accessibility] || null;
  return (
    <React.Fragment>
      {icon}
      {icon && <>&nbsp;</>}
      <span>{description}</span>
    </React.Fragment>
  );
}

type Props = {
  feature: Feature;
  toiletsNearby: Feature[] | null;
  onOpenWheelchairAccessibility: () => void;
  onOpenToiletAccessibility: () => void;
  onOpenToiletNearby: (feature: Feature) => void;
  className?: string;
  isEditingEnabled: boolean;
  showDescription: boolean;
  accessibility: YesNoLimitedUnknown;
};

const ParkingAccessibilityList = styled.ul`
  margin: 0 !important;
  padding: 0;
  list-style-type: none;
`;

const ParkingAccessibilityListItem = styled.li`
  margin-bottom: 0.8rem;
`;

class WheelchairAndToiletAccessibility extends React.PureComponent<Props> {
  renderWheelchairButton(wheelchairAccessibility, showSummary: boolean = true) {
    if (!showSummary && !this.props.showDescription) {
      return null;
    }

    return (
      <button
        className={`accessibility-wheelchair accessibility-${wheelchairAccessibility}`}
        onClick={this.props.onOpenWheelchairAccessibility}
        disabled={!this.props.isEditingEnabled}
      >
        <header>
          {showSummary && <span>{<AccessibilityName accessibility={wheelchairAccessibility} />}</span>}
          {this.props.isEditingEnabled && <PenIcon className="pen-icon" />}
        </header>

        {this.props.showDescription === false ? null : (
          <footer className="accessibility-description">
            {accessibilityDescription(wheelchairAccessibility)}
          </footer>
        )}
      </button>
    );
  }

  renderToiletButton(toiletAccessibility) {
    return (
      <button
        className={`accessibility-toilet accessibility-${toiletAccessibility}`}
        onClick={this.props.onOpenToiletAccessibility}
        disabled={!this.props.isEditingEnabled}
      >
        <header>
          {ToiletDescription(toiletAccessibility)}
          {/* {this.props.isEditingEnabled && <PenIcon className="pen-icon" />} */}
        </header>
      </button>
    );
  }

  renderNearbyToilets() {
    const { feature, toiletsNearby, onOpenToiletNearby } = this.props;
    if (!toiletsNearby) {
      return;
    }

    const featureCoords = normalizedCoordinatesForFeature(feature);
    // for now render only the closest toilet
    return toiletsNearby.slice(0, 1).map((toiletFeature, i) => {
      const toiletCoords = normalizedCoordinatesForFeature(toiletFeature);
      const distanceInMeters = geoDistance(featureCoords, toiletCoords);
      const formattedDistance = formatDistance(distanceInMeters);
      const { distance, unit } = formattedDistance;
      const caption = t`Show next wheelchair accessible toilet`;
      return (
        <button key={i} onClick={() => onOpenToiletNearby(toiletFeature)} className="toilet-nearby">
          {caption}
          <span className="subtle distance">
            &nbsp;{distance}&nbsp;
            {unit}&nbsp;→
          </span>
        </button>
      );
    });
  }

  renderParkingAccessibility() {
    const { feature } = this.props;
    if (!isWheelmapFeature(feature)) {
      return null;
    }
    const tags = feature.properties.tags;
    if (!tags) {
      return null;
    }

    let disabledCapacity = tags['capacity:disabled'];
    if (disabledCapacity === undefined && ['yes', 'no'].includes(feature.properties.wheelchair)) {
      disabledCapacity = feature.properties.wheelchair;
    }
    const disabledCapacityNumeric = isNumericString(tags['capacity:disabled']) ? parseInt(tags['capacity:disabled'], 10) : undefined;
    const capacity = tags.capacity !== tags['capacity:disabled'] ? tags.capacity : undefined;
    const capacityNumeric = isNumericString(tags['capacity']) ? parseInt(tags['capacity'], 10) : undefined;

    const config: [(string) => boolean, (string) => boolean, string, () => string][] = [
      [isUndefined, isUndefined, undefined, () => null ],
      [isPositive,  isUndefined, undefined, () => ngettext(
        msgid`${capacityNumeric} parking lot available.`,
        `${capacityNumeric} parking lots available.`,
        capacityNumeric
      )],
      [isYes,       isUndefined, undefined, () => t`Parking available (accessibility unknown).` ],
      [isUndefined, isZeroOrNo,  'no',      () => t`No accessible parking lots available.` ],
      [isZeroOrNo,  isUndefined, 'no',      () => t`No parking available.` ],
      [isZeroOrNo,  isZeroOrNo,  'no',      () => t`No parking available.` ],
      [isPositive,  isZeroOrNo,  'no',      () => ngettext(
        msgid`${capacityNumeric} parking lot available, but no accessible parking.`,
        `${capacityNumeric} parking lots available, but no accessible parking.`,
        capacityNumeric
      ) ],
      [isYes,       isZeroOrNo,  'no',      () => t`Parking available, but no accessible parking.` ],
      [isUndefined, isPositive,  'yes',     () => ngettext(
        msgid`${disabledCapacityNumeric} accessible parking lot available.`,
        `${disabledCapacityNumeric} accessible parking lots available.`,
        disabledCapacityNumeric
      ) ],
      [isUndefined, isYes,       'yes',     () => t`Accessible parking available.` ],
      [isPositive,  isYes,       'yes',     () => t`Accessible parking available.` ],
      [isYes,       isYes,       'yes',     () => t`Accessible parking available.` ],
      [isPositive,  isPositive,  'yes',     () =>
        ngettext(
          msgid`${disabledCapacityNumeric} accessible parking lot available (${capacityNumeric} total).`,
          `${disabledCapacityNumeric} accessible parking lots available (${capacityNumeric} total).`,
          disabledCapacityNumeric
        )],
      [isYes,       isPositive,  'yes',     () => ngettext(
        msgid`${disabledCapacityNumeric} accessible parking lot available.`,
        `${disabledCapacityNumeric} accessible parking lots available.`,
        disabledCapacityNumeric
      ) ],
    ];

    const foundConfig = config.find(c => c[0](capacity) && c[1](disabledCapacity));
    const accessibilityValue = foundConfig ? foundConfig[2] : null;
    const parkingDescriptionString = foundConfig ? foundConfig[3]() : null;

    return (<ParkingAccessibilityList className={'accessibility-wheelchair accessibility-description'}>
      {foundConfig &&
        <ParkingAccessibilityListItem className={`accessibility-${accessibilityValue}`}>
          {parkingDescriptionString}
        </ParkingAccessibilityListItem>
      }
      {tags.access && <ParkingAccessibilityListItem>{getAccessDescription(tags.access)}</ParkingAccessibilityListItem>}
    </ParkingAccessibilityList>);
  }

  render() {
    const { feature, toiletsNearby, isEditingEnabled } = this.props;
    const { properties } = feature || {};
    if (!properties) {
      return null;
    }

    const wheelmapFeature = isWheelmapFeature(feature) ? feature : undefined;
    const wheelchairAccessibility = isWheelchairAccessible(properties);
    const toiletAccessibility = hasAccessibleToilet(properties);
    const isKnownWheelchairAccessibility = wheelchairAccessibility !== 'unknown';
    const hasAccessibilityDetails = isKnownWheelchairAccessibility || wheelmapFeature && Object.keys(wheelmapFeature.properties.tags).length > 0;
    const categoryId = getCategoryIdFromProperties(properties);
    const hasBlacklistedCategory = includes(placeCategoriesWithoutExtraToiletEntry, categoryId);
    const canAddToiletStatus =
      isEditingEnabled && includes(['yes', 'limited'], wheelchairAccessibility);
    const isToiletButtonShown =
      (isKnownWheelchairAccessibility && !hasBlacklistedCategory && canAddToiletStatus) ||
      (toiletAccessibility === 'yes' && categoryId !== 'toilets');

    const findToiletsNearby =
      toiletAccessibility !== 'yes' && toiletsNearby && toiletsNearby.length > 0;
    const hasContent =
      isKnownWheelchairAccessibility || hasAccessibilityDetails || isToiletButtonShown; /*|| findToiletsNearby*/
    if (!hasContent) {
      return null;
    }

    return (
      <div className={this.props.className}>
        {isKnownWheelchairAccessibility && this.renderWheelchairButton(wheelchairAccessibility, !wheelmapFeature || !isParkingFacility(wheelmapFeature))}
        {this.renderParkingAccessibility()}
        {isToiletButtonShown && this.renderToiletButton(toiletAccessibility)}
        {findToiletsNearby && this.renderNearbyToilets()}
      </div>
    );
  }
}

const StyledBasicPlaceAccessibility = styled(WheelchairAndToiletAccessibility)`
  display: flex;
  flex-direction: column;
  margin: 0;

  > button {
    margin: -10px;
    padding: 10px;
    border: none;
    outline: none;
    appearance: none;
    font-size: 1rem;
    text-align: inherit;
    background-color: transparent;
    /* Avoid jumping layout while loading */
    &.toilet-nearby {
      justify-content: space-between;
    }
    :not(:disabled) {
      cursor: pointer;
      &.toilet-nearby {
        color: ${colors.linkColor};
        font-weight: bold;
      }
      &:hover {
        &.accessibility-yes {
          background-color: ${colors.positiveBackgroundColorTransparent};
        }
        &.accessibility-limited {
          background-color: ${colors.warningBackgroundColorTransparent};
        }
        &.accessibility-no {
          background-color: ${colors.negativeBackgroundColorTransparent};
        }
        &.accessibility-unknown {
          background-color: ${colors.linkBackgroundColorTransparent};
        }
      }
    }
  }

  > button + button {
    margin-top: calc(-5px + 1rem);
  }

  > * {
    margin: 1rem 0;
  }
  > *:last-child {
    margin-bottom: 0;
  }

  header {
    :first-child {
      margin: 0;
    }
    &:not(:first-child) {
      margin: 0.25rem 0 0 0;
    }
  }

  .accessibility-wheelchair {
    header {
      justify-content: space-between;
    }
  }

  .accessibility-wheelchair,
  .accessibility-toilet {
    header {
      font-weight: bold;
      display: flex;
      flex-direction: row;
      align-items: center;
    }
  }

  .accessibility-description {
    font-weight: normal;
  }

  .accessibility-yes {
    font-weight: bold;
    color: ${colors.positiveColorDarker};
    .pen-icon path {
      fill: ${colors.positiveColorDarker};
      stroke: ${colors.positiveColorDarker};
    }
  }
  .accessibility-limited {
    font-weight: bold;
    color: ${colors.warningColorDarker};
    .pen-icon path {
      fill: ${colors.warningColorDarker};
      stroke: ${colors.warningColorDarker};
    }
  }
  .accessibility-no {
    font-weight: bold;
    color: ${colors.negativeColorDarker};
    .pen-icon path {
      fill: ${colors.negativeColorDarker};
      stroke: ${colors.negativeColorDarker};
    }
  }
  .accessibility-unknown {
    font-weight: bold;
    color: ${colors.linkColor};
    .pen-icon path {
      fill: ${colors.linkColor};
      stroke: ${colors.linkColor};
    }
  }

  .accessibility-description {
    margin: 0.25rem 0;
    color: rgba(0, 0, 0, 0.6);
  }

  > header > span {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .toilet-nearby {
    display: flex;
    align-items: center;

    .right-arrow {
      padding: 0 10px;
    }

    &:hover {
      background-color: ${colors.linkBackgroundColorTransparent};
    }
  }
`;

export default StyledBasicPlaceAccessibility;
