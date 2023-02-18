const publicPath = '/'
const isDev = process.env.NODE_ENV === 'development'
export const sceneConfig = {
    // backgroundType: 'none',
    // backgroundType: 'color',
    backgroundType: 'image',
    // backgroundColor: 0xff0000,
    // backgroundType: 'skybox',
    backgroundUrl: publicPath + '3D/resource/img/bg.png',
    // skyImgPath: publicPath + '3D/resource/img/night/',
    statsHelper: true,
    coordinateHelper: isDev,
    managerConfig: {
        selectionConfig: {
            transparent: true,
            opacity: 0.5,
            color: 0x43cfda
        }
    },
    cameraConfig: [
        {
            name: 'perspective_camera',
            cameraType: 'perspective',
            position: [0, 200, 200],
            target: [0, 0, 0],
            active: true,
            far: 5000,
            near: 0.1
        }
    ],
    lightConfig: [
        {
            name: 'ambient_light',
            type: 'ambient',
            intensity: 1,
            color: 0x000000,
            position: [0, 0, 0]
        }
    ],
    interactionConfig: {
        rightMenu: isDev,
        orbitConfig: [
            {
                name: 'fristOrbit',
                upAngle: 135,
                downAngle: 0,
                maxDistance: 150,
                minDistance: 0.1
            }
        ]
    }
}
