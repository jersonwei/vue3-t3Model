import config from '../config/material'
const THREE = window.THREE
const swithTypeArr = ['depthTest', 'depthWrite']
export default class ParamTooler {
    static TYPE_NUMBER = 'type number';
    static TYPE_COLOR = 'type color';
    static TYPE_IMAGE = 'type image';
    static TYPE_SWITCH = 'type switch';

    static getType(name) {
        let type
        name = name.split('.')[0]
        if (name.substr(-7).toLowerCase() === 'visible' || swithTypeArr.includes(name)) {
            type = this.TYPE_SWITCH
        } else if (name.substr(-5).toLowerCase() === 'color') {
            type = this.TYPE_COLOR
        } else if (name === 'wireframe' || name === 'transparent') {
            type = this.TYPE_SWITCH
        } else if (this.checkMap(name)) {
            type = this.TYPE_IMAGE
        } else if (name === 'emissive' || name === 'specular') {
            type = this.TYPE_COLOR
        } else {
            type = this.TYPE_NUMBER
        }
        return type
    }

    static checkMap(name) {
        return name.substr(-3).toLowerCase() === 'map'
    }

    static setObjectValue(mesh, newData) {
        Object.keys(newData).forEach((key) => {
            if (key === 'position' || key === 'scale' || key === 'rotation') {
                mesh[key].x = newData[key][0]
                mesh[key].y = newData[key][1]
                mesh[key].z = newData[key][2]
            } else {
                mesh[key] = newData[key]
            }
        })
    }

    static copyMeshProps(mesh) {
        const {
            position,
            rotation,
            scale,
            castShadow,
            receiveShadow,
            visible,
            renderOrder,
            name,
            type
        } = mesh
        return {
            castShadow,
            receiveShadow,
            visible,
            renderOrder,
            name,
            type,
            position: [
                position.x,
                position.y,
                position.z
            ],
            rotation: [
                rotation.x,
                rotation.y,
                rotation.z
            ],
            scale: [
                scale.x,
                scale.y,
                scale.z
            ]
        }
    }

    static copyMaterialParam(material) {
        if (!material) {
            return null
        }
        const data = config.find((item) => item.type === material.type)
        const obj = {}
        for (const i in data.param) {
            if (i === 'normalScale') {
                obj[i] = material[i] ? material[i].x : 0.1
            } else {
                if (this.checkMap(i)) {
                    if (material[i] && material[i].image) {
                        obj[i] = {
                            image: material[i].image.currentSrc,
                            repeatX: material[i].repeat.x,
                            repeatY: material[i].repeat.y
                        }
                    } else {
                        obj[i] = {}
                    }
                } else {
                    obj[i] = material[i]
                }
            }
        }
        return obj
    }

    static changeTextureMaterial(material, key, value) {
        const { image, repeatX, repeatY } = value
        return new Promise((resolve, reject) => {
            if (image) {
                const texture = new THREE.TextureLoader().load(image, () => {
                    resolve()
                })
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.RepeatWrapping
                material[key] = texture
                material[key].repeat.x = Number(repeatX)
                material[key].repeat.y = Number(repeatY)
            } else {
                material[key] = null
                resolve()
            }
        })
    }

    static getObjectData(obj, scene, gridVisible, selectedColor) {
        let type
        let name
        let parameters
        let transform
        let extra
        let uuid

        if (obj) {
            type = obj.type
            transform = ParamTooler.copyMeshProps(obj)
            uuid = obj.uuid

            if (obj.material) {
                name = 'Mesh'

                const material = ParamTooler.copyMaterialParam(obj.material)
                const temp = obj.geometry
                let geometry

                if (obj.geometry.isGeometry) {
                    geometry = {}
                } else {
                    geometry = {
                        ...temp.attributes,
                        index: obj.geometry.getIndex()
                    }
                }

                parameters = obj.geometry.parameters

                extra = {
                    geometry: geometry,
                    material: material,
                    materialType: obj.material ? obj.material.type : ''
                }
            } else if (type.substr(-5) === 'Light') {
                name = obj.name
                parameters = obj.parameters
            } else if (type === 'Group') {
                name = 'Group'
            } else if (type === 'Object3D') {
                name = 'Object3D'
            }

            name = obj.name || name
        } else {
            type = 'Scene'
            name = 'Scene'
            parameters = {
                fogVisible: !!scene.fog,
                fogColor: scene.fog ? scene.fog.color : '#ffffff',
                near: scene.fog ? scene.fog.near : 0,
                far: scene.fog ? scene.fog.far : 100,
                gridVisible: gridVisible,
                selectedColor: selectedColor || '#ff0000'
            }
        }

        return {
            uuid,
            type,
            name,
            parameters,
            transform,
            extra
        }
    }

    // 设置配置参数
    static async setConfig(params, key, value, callback) {
        if (ParamTooler.checkMap(key)) {
            await this.changeTextureMaterial(params, key, value)
            if (callback) callback()
        } else {
            const type = ParamTooler.getType(key)
            if (key === 'normalScale') {
                params[key] = new window.THREE.Vector2()
                    .set(1, -1)
                    .multiplyScalar(Number(value))
            } else {
                if (type === ParamTooler.TYPE_COLOR) {
                    params[key] = new window.THREE.Color(value)
                } else if (type === ParamTooler.TYPE_NUMBER) {
                    params[key] = Number(value)
                } else if (type === ParamTooler.TYPE_SWITCH) {
                    params[key] = Boolean(value)
                }
            }
        }
    }

    static parseConfig = (params, callback) => {
        const paramsCopy = JSON.parse(JSON.stringify(params))
        const arr = ['id', 'name', 'type', 'meshName']
        arr.forEach((key) => delete paramsCopy[key])
        Object.keys(paramsCopy).forEach((element) => {
            this.setConfig(paramsCopy, element, params[element], callback)
        })
        return paramsCopy
    };
}
