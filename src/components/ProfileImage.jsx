import React, {useState} from 'react';
import {Image} from 'react-native';
import ProfilePlaceholder from './ProfilePlaceholder';

export default function ProfileImage({uri, gender, style}) {
  const [failedUri, setFailedUri] = useState(null);
  return uri && failedUri !== uri
    ? <Image source={{uri}} style={style} resizeMode="cover" onError={() => setFailedUri(uri)} />
    : <ProfilePlaceholder gender={gender} style={style} />;
}
