
import { useState, useEffect } from 'react';

export const useKakaoLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.kakao) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=ca0816bee0db23ce6c74a1cb0c58b9b4&libraries=services&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  return isLoaded;
};
