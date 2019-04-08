import React from 'react';
import { t } from 'ttag';
import styled from 'styled-components';
import FocusTrap from 'focus-trap-react';

import Toolbar from '../Toolbar';
import MappingEventShareBar from './MappingEventShareBar';
import Link from '../Link/Link';
import MapPinWithPlusIcon from './MapPinWithPlusIcon';
import BellIcon from './BellIcon';
import { AppContextConsumer } from '../../AppContext';
import ChevronLeft from './ChevronLeft';
import CloseButton from './CloseButton';

const MappingEventToolbar = ({ className, mappingEvent, onClose, productName }) => {
  const date = new Date(mappingEvent.startTime.$date);

  return (
    <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
      <Toolbar
        className={className}
        ariaLabel={t`Mapping Event ${mappingEvent.name}`}
        role="dialog"
      >
        <CloseButton onClick={onClose} />
        <header>
          <Link to="mappingEvents" aria-label={t`Zurück zur Mapping Events Liste`}>
            <ChevronLeft />
          </Link>
          <div>
            <h2>{mappingEvent.name}</h2>
            <p>{`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`}</p>
          </div>
        </header>
        <div className="actions">
          <AppContextConsumer>
            {appContext => (
              <MappingEventShareBar
                mappingEvent={mappingEvent}
                buttonCaption={t`Share link`}
                baseUrl={appContext.baseUrl}
                productName={productName}
              />
            )}
          </AppContextConsumer>
        </div>
        <img
          className="mapping-event-image"
          src={
            mappingEvent.photoUrl ? mappingEvent.photoUrl : '/static/images/eventPlaceholder.png'
          }
          alt=""
        />
        <section className="statistics" aria-label={t`Mapping Event Zahlen`}>
          <div>
            <div className="statistics-count">
              <MapPinWithPlusIcon />
              <span>{mappingEvent.statistics.mappedPlacesCount}</span>
            </div>
            <div className="statistics-description">{t`map places`}</div>
          </div>
          <div>
            <div className="statistics-count">
              <BellIcon />
              <span>{mappingEvent.statistics.invitedParticipantCount}</span>
            </div>
            <div className="statistics-description">{t`people invited`}</div>
          </div>
        </section>
        <div className="mapping-event-description">{mappingEvent.description}</div>
      </Toolbar>
    </FocusTrap>
  );
};

const StyledMappingEventToolbar = styled(MappingEventToolbar)`
  padding-top: 0;
  color: #22262d;
  line-height: 1.2;

  header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: 10px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }

  p {
    color: #676b72;
    font-size: 16px;
    font-weight: 400;
    margin: 0;
    line-height: 1.2;
  }

  .link-button {
    display: flex;
    align-items: center;
  }

  .link-button:not(:hover) {
    color: #494e53;
  }

  .link-button svg {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 1rem;
    fill: #89939e;
  }

  .actions {
    display: flex;
    margin-bottom: 20px;
  }

  .mapping-event-image {
    width: calc(100% + 30px);
    margin: 0 -15px 20px;
  }

  .statistics {
    display: flex;
    justify-content: space-around;
    text-align: center;
    margin-bottom: 20px;

    svg {
      margin-right: 10px;
    }
  }

  .statistics-count {
    font-size: 27px;
    font-weight: 300;
    color: #37404d;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .statistics-description {
    font-size: 14px;
    color: #22262d;
  }

  .mapping-event-description {
    margin-bottom: 20px;
  }
`;

export default StyledMappingEventToolbar;
