const commom = {
    color: '#ff0000',
    map: null,
    wireframe: false,
    opacity: 0.1,
    transparent: true,
    side: null,
    visible: true,
    depthTest: true,
    depthWrite: true,
    alphaTest: 0
}

export default [
    {
        name: 'MeshBasicMaterial',
        type: 'MeshBasicMaterial',
        param: {
            ...commom
        }
    },
    {
        name: 'MeshNormalMaterial',
        type: 'MeshNormalMaterial',
        param: {
            ...commom
        }
    },
    {
        name: 'MeshLambertMaterial',
        type: 'MeshLambertMaterial',
        param: {
            ...commom,
            emissive: '#ffffff',
            emissiveIntensity: 0.1,
            reflectivity: 0.1,
            refractionRatio: 0.1
        }
    },
    {
        name: 'MeshPhongMaterial',
        type: 'MeshPhongMaterial',
        param: {
            ...commom,
            emissive: '#ffffff',
            emissiveIntensity: 0.1,
            reflectivity: 0.1,
            refractionRatio: 0.1,
            specular: '#ffffff',
            shininess: 0.1,
            bumpMap: null,
            bumpScale: 0.1,
            normalMap: null,
            normalScale: 0.1,
            displacementMap: null,
            displacementScale: 0.1
        }
    },
    {
        name: 'MeshToonMaterial',
        type: 'MeshToonMaterial',
        param: {
            ...commom
        }
    },
    {
        name: 'MeshStandardMaterial',
        type: 'MeshStandardMaterial',
        param: {
            ...commom,
            emissive: '#ffffff',
            emissiveIntensity: 0.1,
            roughness: 0.1,
            metalness: 0.1,
            bumpMap: null,
            bumpScale: 0.1,
            normalMap: null,
            normalScale: 0.1,
            displacementMap: null,
            displacementScale: 0.1
        }
    }
]
