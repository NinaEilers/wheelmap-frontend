import { Photo } from 'react-photo-album';

export type PhotoModel = Photo & {
  appSource: 'wheelmap' | 'accessibility-cloud' | 'generated';
};
