
import React, { useState, useEffect } from 'react';

import './Viewer.scss';


const Viewer = props => {
  const {
    idx, total, src, name, tags, location, camera, setCurrentIndex
  } = props;
  const [ viewer, setViewer ] = useState();
  const [ index, setIndex ] = useState('');
  useEffect(() => {
    setIndex(idx + 1);
    console.log(`${window.location.origin}/images/${src}`);
    let pano = new window.PANOLENS.ImagePanorama(`${window.location.origin}/images/${src}`);
    let v;
    if (viewer) {
      v = viewer;
    } else {
      v = new window.PANOLENS.Viewer({
        container: document.getElementById('myVwr'),
        cameraFov: 65,
        autoRotate: true,
        autoRotateSpeed: 1,
        autoRotateActivationDuration: 10000
      });
      v.getCamera().translateX(500);
      v.getCamera().translateY(-100);
      setViewer(v);
    }
    v.clearAllCache();
    v.add(pano);
    v.setPanorama(pano);
  }, [idx]);
  return (
    <div
      className='my-vwr-wrapper'>
      <div className='my-vwr-header'>
        <span className='index'>
          <input
            type='number'
            value={index}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const x = parseInt(index)
                if (x >= 1 && x <= total) {
                  setCurrentIndex(x - 1);
                }
              }
            }}
            size={`${index}`.length}
            onChange={e => setIndex(e.target.value)}/>
          { `/${total}` }
        </span>
        <div className='content'>
          <strong>
            { name }
          </strong>
          <div>
           { location }
          </div>
        </div>
      </div>
      <div
        id='myVwr'
        className='my-vwr'>
      </div>
      <div className='my-vwr-footer'>
        {
          tags.map((t, i) => (
            <span
              key={i}>
              { `#${t}` }
            </span>
          ))
        }
      </div>
    </div>
  )
}

export default Viewer;
