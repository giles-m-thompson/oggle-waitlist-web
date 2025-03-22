import * as BABYLON from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import { LogManager } from '../logging/LogManager';
import { Level } from '../logging/Level';


/**
 * A SUPER stripped back version of Oggle's internal EngineManager subsystem, 
 * created purely for the purposes of demoing various aspects of the platform, 
 * live on the home page of the main website. The demoed features will be initially 
 * constrained to the loading of various device meshes and their dynamic customization 
 * i.e loading video/image screens changing the device colour/opacity,etc.
 * @date March 21st 2025, 3:16:08 pm
 * @author Giles Thompson
 *
 * @class EngineManager
 * @typedef {EngineManager}
 */
class EngineManager {

    constructor(aRenderTargetDivId) {
        this.renderTargetDivId = aRenderTargetDivId;
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.sceneCamera = null;
        this.sceneLight = null;
        this.initialised = false;
        this.topShadowingEnabled = true;
        this.fps = 30;
        this.lastTime = 0;
        this.frameDuration = 1000 / this.fps;
    }

    /**
    * Singleton Factory Method,
    * returns a Singleton reference to an EngineManager.
    * @param aRenderTargetDivId The ID of the target div that the Engine Rendering Viewport UI should be rendered to.
    * 
    * @returns {EngineManager}
    */
    static getSingletonInstance(aRenderTargetDivId) {
        if (!EngineManager.globalInstance) {
            EngineManager.globalInstance = new EngineManager(aRenderTargetDivId);
        }
        return EngineManager.globalInstance;
    }

    initialise() {
        this.#prepareDefaultScene();
    }





    //private helper methods
    #prepareDefaultScene() {

        const renderingCanvas = this.#createEngineRenderingViewportCanvas();
        this.#disableCanvasTouchEvents(renderingCanvas);
        this.engine = new BABYLON.Engine(renderingCanvas, true, { antialias: true, multisample: true, preserveDrawingBuffer: true, disableWebGL2Support: false }, true);
       

        //this.engine.setSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.useRightHandedSystem = true; //NB: Critical for GLTF Models as they use right-hand co-ordinates.
        this.scene.shadowsEnabled = true;
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        this.scene.getEngine().setHardwareScalingLevel(1 / window.devicePixelRatio);
        

        //set scene background
        this.background = this.#createSceneBackground(this.scene);

        //add and configure camera...
        const cameras = this.#setupSceneCameras();
        this.sceneCamera = cameras.mainCamera;
        this.sceneCameraReferenceCamera = cameras.referenceCamera;

        //add and configure scene lights and shadows.
        this.sceneLight = this.#setupSceneLightsAndShadows(1);

        //setup scene plane
        //this.scenePlane = this.#setupScenePlane(); //set from fixed default values, this may be later overridden by template/scene specific customisations.

        //setup scene HDR IBL texture
        const sceneHdrTexture = this.#setupSceneHdrIBLEnvTexture(1.5);

        const pipeline = this.#setupRenderingPipeline();

        var glowLayer = new BABYLON.GlowLayer("glowLayer", this.scene)
        glowLayer.intensity = 0.25


        //init scene gizmos
        //this.#initSceneGizmos();

        //attach engine window resize listener
        //this.#attachWindowResizeListener();

        //setup optional onSceneReady callback handler
        this.#setupSceneReadyHandler();

        //setup up drag and drop handler for device meshes, this will enable
        //the use to dynamically drag and drop images or videos to a devices screen.
        this.#setupDeviceMeshDragAndDrop();

     
        //attach engine to the scene so its globally available
        //TODO: Remove this logic, an external code that requires access to the 
        //      underlying engine should obtain it via this EngineManager class.
        window.editorEngine = this.engine;

       
    }


    #createEngineRenderingViewportCanvas() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "oggle-3d-editor-rendering-viewport-canvas";
        //this.canvas.width = 600; //window.innerWidth * window.devicePixelRatio;
        //this.canvas.height = 100;//window.innerHeight * window.devicePixelRatio;
        //this.canvas.ontouchstart
        const mainUIRenderTarget = this.#resolveRenderTargetElementById(this.renderTargetDivId);
        mainUIRenderTarget.appendChild(this.canvas);
        return this.canvas;
    }


    #disableCanvasTouchEvents(aRenderingCanvas) {

        aRenderingCanvas.addEventListener("touchstart", function (e) {
            if (e.touches.length >= 1) {
                e.preventDefault();
                e.stopPropergation();
            }
        }, { noPreventDefault: true });

        aRenderingCanvas.addEventListener("touchmove", function (e) {
            if (e.touches.length >= 1) {
                e.preventDefault();
                e.stopPropergation();
            }
        }, { noPreventDefault: true });

    }

    #createSceneBackground(aScene,aURL) {

    }

    #setupSceneCameras() {
        const mainCamera = this.#setupMainCamera();
        const referenceCamera = null; //only a SINGLE camera is required for the platform demo.
        this.scene.activeCameras = [mainCamera];

        const sceneCameras = {
            "mainCamera": mainCamera,
            "referenceCamera": referenceCamera
        }
        return sceneCameras;
    }

    #setupMainCamera() {

        /*
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,
            (this.topShadowingEnabled) ? (Math.PI / 2) - 0.10 : Math.PI / 2, 
            3.5,
            BABYLON.Vector3.Zero(),
            this.scene);
        */
        const camera = new BABYLON.ArcRotateCamera("camera", 3 * Math.PI / 4, Math.PI / 4, 4, BABYLON.Vector3.Zero(), this.scene);
        camera.setTarget(BABYLON.Vector3.Zero()); // This targets the camera to scene origin
        camera.lowerBetaLimit = -Math.PI / 264;   // Set the lower vertical rotation limit (to look straight up)
        camera.upperBetaLimit = Math.PI           // Set the upper vertical rotation limit (to look straight down)
        camera.wheelDeltaPercentage = 0.01;
        camera.minZ = 0.1
        camera.attachControl(this.canvas, true);

        LogManager.getInstance().log(Level.DEBUG, camera);
        return camera
    }

     //resolves render target, which should be a div, by ID
    #resolveRenderTargetElementById(anElementId) {
        return document.getElementById(anElementId);
    }

    #setupSceneLightsAndShadows(lightIntensity) {
            //main light and shadows..
            const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-0.88, -80, 0.67), this.scene);
            //const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-0.88, -80, -0.76), this.scene);
            light.intensity = lightIntensity;
            light.shadowEnabled = true;
            
            //NB: The rest of the lighting/shadow config has been omitted for this demo.....
            return light;
    }

    #setupSceneHdrIBLEnvTexture(aLevel) {
        
        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./src/engine/envtextures/hard-light.env", this.scene);
        hdrTexture.level = aLevel
        hdrTexture.gammaSpace = true;
        hdrTexture.anisotropicFilteringLevel = 64;
        this.scene.environmentTexture = hdrTexture;

    }

    #setupRenderingPipeline() {

        //this.scene.imageProcessingConfiguration.exposure = 0.7;
        //this.scene.imageProcessingConfiguration.contrast = 0.95;

        const pipeline = new BABYLON.DefaultRenderingPipeline(
            "defaultPipeline", // The name of the pipeline
            false, // Do you want the pipeline to use HDR texture?
            this.scene, // The scene instance

        );

        pipeline.bloomKernel = 64; // Reduce the bloom kernel size for smoother effect
        pipeline.bloomWeight = 0.8; // Increase bloom weight for a stronger effect
        pipeline.bloomThreshold = 0.1; // Adjust bloom threshold to control which parts contribute to bloom
        pipeline.bloomScale = 0.5; // Scale down bloom intensity to reduce aliasing
        pipeline.fxaaEnabled = true; // Enable FXAA for additional anti-aliasing
        pipeline.samples = 8; // Increase the number of samples for better quality anti-aliasing



        return pipeline;
    }

    #attachWindowResizeListener() {
        const self = this;
        window.addEventListener('resize', (e) => {
            self.canvas.width = window.innerWidth;
            self.canvas.height = window.innerHeight;
            self.engine.resize();
        })
    }

    #setupSceneReadyHandler() {

        const self = this;
        this.scene.executeWhenReady(function () {

            //start main render loop
            self.#startRenderLoop();

            const box = BABYLON.MeshBuilder.CreateBox("box", {height: 2, width: 0.75, depth: 0.25},this.scene);

            const pbrMaterial = new BABYLON.PBRMaterial("pbr", this.scene);

pbrMaterial.metallic = 0.5;  // Adjust metallic factor
pbrMaterial.roughness = 0.3; // Adjust roughness factor

  box.material = pbrMaterial;

            

        });

    }

    #startRenderLoop() {
        const self = this;
        this.engine.runRenderLoop(() => {

            // self.scene.render();
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastTime;

            if (deltaTime >= this.frameDuration) {
                this.lastTime = currentTime;
                this.scene.render();
                
            }


        })
    }

    #setupDeviceMeshDragAndDrop() {



        //create drag and drop prompt
        // this.#createDragAndDropPrompt();

        //create drag and drop error prompt
        //this.#createDragAndDropError();


        //inner func determiens whether a device mesh exists at the current mouse position.
        const pickedDeviceMesh = (pointerX, pointerY) => {

            const pickInfo = this.scene.pick(pointerX, pointerY);

            if (pickInfo.hit) {
                const hoveredMesh = pickInfo.pickedMesh;

                const deviceMesh = this.#locateRootMesh(hoveredMesh).parentDeviceMesh;

                if (deviceMesh) {
                    return deviceMesh;
                }

            }

            return null

        }


        const pickedVideoMesh = (pointerX, pointerY) => {

            const pickInfo = this.scene.pick(pointerX, pointerY);

            if (pickInfo.hit) {
                const hoveredMesh = pickInfo.pickedMesh;

                const videoMesh = this.#locateRootMesh(hoveredMesh).parentVideoMesh;

                if (videoMesh) {
                    return videoMesh;
                }

            }

            return null

        }


        //inner func, where the dragged file is an image or video, reference to it is returned.
        const draggedImageOrVideoFile = (event) => {

            const items = event.dataTransfer.items;
            if (items.length === 0) return;

            //if this is being called during a drop event the file will be available..
            const file = items[0].getAsFile();
            if (file) {
                if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                    return file;
                } else {
                    return null
                }
            } else {

                //otherwise we get the type without the file object
                const fileType = items[0].type;
                if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
                    return fileType;
                } else {
                    return null;
                }
            }
        }

        const hideDragDropPrompt = () => {
            var dragDropPrompt = document.getElementById('dragDropPrompt');
            dragDropPrompt.style.top = '-200px';
            dragDropPrompt.style.opacity = 0;
        }

        const hideDragDropError = () => {
            var dragDropError = document.getElementById('dragDropError');
            dragDropError.style.top + 10 + 'px';
            dragDropError.style.opacity = 0;
        }




        //handle drop events
        window.addEventListener('drop', (event) => {
            event.preventDefault();

            // Get the mouse coordinates
            var x = event.clientX;
            var y = event.clientY;

            // Perform the pick based on the last recorded mouse position
            const pickInfo = this.scene.pick(x, y);

            if (pickInfo.hit) {
                const hoveredMesh = pickInfo.pickedMesh;
                /** @type {DeviceMesh | VideoMesh} */
                const deviceOrVideoMesh = (this.#locateRootMesh(hoveredMesh).parentDeviceMesh) ? this.#locateRootMesh(hoveredMesh).parentDeviceMesh : this.#locateRootMesh(hoveredMesh).parentVideoMesh;

                if (deviceOrVideoMesh) {

                    //only a single drag and drop upload may be handled at any one time, we can determine
                    //if an upload is in progress by checking if the "deviceToFileUploadNameMap" contains an 
                    //entry. Uploads that are in-progress are stored to this map.
                    if (this.deviceToFileUploadNameMap.size > 0) {

                        //log message to inform user that an upload is already in progress
                        //TODO:GT We may want to publish an event for the upcoming NotificationManager to pick up and display in the UI, here.
                        LogManager.getInstance().logAll(Level.ERROR, "An upload is already in progress, please wait until it is complete.");
                        return;
                    }

                    if (event.dataTransfer.items[0].kind === 'file') {
                        const file = event.dataTransfer.items[0].getAsFile();
                        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                            //process upload, for the dropped file...
                            //...for now create a blob of the URL on the front end.
                            const blobURL = URL.createObjectURL(file);
                            LogManager.getInstance().log(Level.INFO, "File Dropped On Device Mesh: %s Dropped File Was: %s", hoveredMesh.name, file.name);
                            LogManager.getInstance().log(Level.DEBUG, 'Blob URL: %s', blobURL);

                            //set the last upload attempted device name, this will be cleared once the device
                            //is map to the file name on receopt of the STARTED event from the VideoPlaybackManager
                            this.lastUploadRequestDevice = deviceOrVideoMesh;

                            this.videoPlaybackManager.appendSegmentToVideoSequence(
                                deviceOrVideoMesh,
                                true,
                                blobURL
                            ).then(() => {

                                //here we handle updating the top-level scene object to reflect that 
                                //a new video segment has been updated.
                                //NB: HOLD OF DOING THIS SINCE WE MIGHT WANT TO INDRODUCE A NEW LIST TYPE
                                //    THAT WILL DISPLAY ALL VIDEO SEGMENTS ASSOCIATED WITH THE MESH. WE
                                //    ALREADY HOLD THAT DATA IN THE SCENE OBJECT. 

                            })

                            //TODO:GT: Remove this post testing, the VideoManager will implicitly take care
                            //         of undertaking the video normalizing step once completed it will
                            //         fire an event to notify the EngineManager that a video has been 
                            //         prepared for a device, the DeviceSceneObject will be included in the payload.
                            //         The EngineManager will 
                            /*
                            const videoProcessor = new VideoProcessor();
                            videoProcessor.init()
                                          .then(async () => {
    
                                                const normalizedVidURL =  await videoProcessor.nomalizeVideo(blobURL);
    
                                                //load the image or video to the device mesh as a screen texture. .
                                                deviceMesh.updateScreenTextureURL(normalizedVidURL);
                    
                                                //update the property in the device mesh scene object
                                                const deviceMeshSceneObject = deviceMesh.parentMesh.sceneObject;
                                                const updatedPropertyName = "screenTextureURL";
                                                deviceMeshSceneObject[updatedPropertyName] = normalizedVidURL;
                    
                                                //publish (global) event via EventManager to notify interested subsystems (principally the InspectorManager) 
                                                //that the device mesh screen texture has been updated.
                                                const sceneObjectUpdateEventPayload = new SceneObjectUpdate(deviceMeshSceneObject,updatedPropertyName);
                                                this.#publishEvent(Topics.APP_ENGINE_MGR_SCENE_MESH_UPDATED,sceneObjectUpdateEventPayload);
    
                                          })
    
                        */

                            /*
                                //load the image or video to the device mesh as a screen texture. .
                                deviceMesh.updateScreenTextureURL(blobURL);
        
                                //update the property in the device mesh scene object
                                const deviceMeshSceneObject = deviceMesh.parentMesh.sceneObject;
                                const updatedPropertyName = "screenTextureURL";
                                deviceMeshSceneObject[updatedPropertyName] = blobURL;
        
                                //publish (global) event via EventManager to notify interested subsystems (principally the InspectorManager) 
                                //that the device mesh screen texture has been updated.
                                const sceneObjectUpdateEventPayload = new SceneObjectUpdate(deviceMeshSceneObject, updatedPropertyName);
                                this.#publishEvent(Topics.APP_ENGINE_MGR_SCENE_MESH_UPDATED, sceneObjectUpdateEventPayload);
                                */
                        } else {

                            LogManager.getInstance().logAll(Level.ERROR, 'Unsupported file type: %s dropped on device mesh: %s,', null, file.type, hoveredMesh.name);

                        }

                    }
                } else {

                    LogManager.getInstance().logAll(Level.ERROR, "Dropped file on non-device mesh: %s", null, hoveredMesh.name);
                }

            } else {
                LogManager.getInstance().log(Level.INFO, "File dropped outside any mesh");;
            }

            //clear drop prompt
            hideDragDropPrompt();
            hideDragDropError();

        });


        window.addEventListener('dragover', (event) => {
            event.preventDefault(); // Necessary to prevent unexpected default handling of the drag event.


            //if the camera is engaged, display message to the user to indicate that they
            //will need to disengage the camera before dropping a file.
            if (this.sceneCameraControlsAttached && draggedImageOrVideoFile(event)) {

                // Get the dimensions of the div
                var dragDropError = document.getElementById('dragDropError');
                var divWidth = dragDropError.offsetWidth;
                var divHeight = dragDropError.offsetHeight;

                // Get the mouse coordinates
                var x = event.clientX;
                var y = event.clientY;

                // Update the position of the div, centering it around the mouse pointer
                dragDropError.style.left = (x - divWidth / 2) + 'px';
                dragDropError.style.top = (y - divHeight / 2) - 170 + 'px';

                dragDropError.style.opacity = 1;
                dragDropError.style.top = dragDropError.style.top + 10 + 'px';



                LogManager.getInstance().log(Level.INFO, "Camera engaged, please disengage the camera before dropping a file.");;
                return false


            }

            // Check if a file is being dragged
            var isFileDragged = false;
            for (var i = 0; i < event.dataTransfer.items.length; i++) {
                if (event.dataTransfer.items[i].kind === 'file') {
                    isFileDragged = true;
                    break; // Exit loop if a file is found
                }
            }

            // Get pointer position from the event
            const pointerX = event.clientX;
            const pointerY = event.clientY;

            if (isFileDragged
                && (pickedDeviceMesh(pointerX, pointerY) || pickedVideoMesh(pointerX, pointerY))
                && draggedImageOrVideoFile(event)
                && this.deviceToFileUploadNameMap.size == 0) {



                // Get the dimensions of the div
                var dragDropPrompt = document.getElementById('dragDropPrompt');
                var divWidth = dragDropPrompt.offsetWidth;
                var divHeight = dragDropPrompt.offsetHeight;

                // Get the mouse coordinates
                var x = event.clientX;
                var y = event.clientY;

                // Update the position of the div, centering it around the mouse pointer
                dragDropPrompt.style.left = (x - divWidth / 2) + 'px';
                dragDropPrompt.style.top = (y - divHeight / 2) - 70 + 'px';

                dragDropPrompt.style.opacity = 1;
                dragDropPrompt.style.top = dragDropPrompt.style.top + 200 + 'px';
            } else {

                hideDragDropPrompt();

            }

        });



        window.addEventListener('dragleave', function (event) {

            //clear dragDropPrompt
            hideDragDropPrompt();
            hideDragDropError();
        });


    }

    #locateRootMesh(aMesh) {

        if (aMesh.parent == undefined || aMesh.parent == null || aMesh._parentNode == null) {
            return aMesh;
        }

        return this.#locateRootMesh(aMesh.parent);
    }


}

export { EngineManager }