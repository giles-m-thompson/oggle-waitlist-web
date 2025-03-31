import * as BABYLON from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import axios from "axios";
import {DeviceMesh} from '../engine/meshes/DeviceMesh'
import { ColorEditor } from './utils/ColorEditor';
import { LogManager } from '../logging/LogManager';
import { Level } from '../logging/Level';
import { DragDropPanel } from './utils/DragDropPanel';


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

    constructor(
        aRenderTargetDivId,
        colorEditorTargetElementId,
        dragDropPanelTargetElementId
    ) {
        this.renderTargetDivId = aRenderTargetDivId;
        this.colorEditorTargetElementId = colorEditorTargetElementId;
        this.dragDropPanelTargetElementId = dragDropPanelTargetElementId;
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
        /**  @type {DeviceMesh} */
        this.demoDeviceMesh = null
        this.colorEditor = null;
        this.dragAndDropPanel = null;
        this.deviceToFileUploadNameMap = null;
        this.curVideoElement = null;
        
    }

    /**
    * Singleton Factory Method,
    * returns a Singleton reference to an EngineManager.
    * @param aRenderTargetDivId The ID of the target div that the Engine Rendering Viewport UI should be rendered to.
    * 
    * @returns {EngineManager}
    */
    static getSingletonInstance(
        aRenderTargetDivId,
        aColorEditorRenderTargetDiv,
        aDragDropPanelTargetDiv
    ) {
        if (!EngineManager.globalInstance) {
            EngineManager.globalInstance = new EngineManager(
                aRenderTargetDivId,
                aColorEditorRenderTargetDiv,
                aDragDropPanelTargetDiv
            );
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
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);  //for transparent scene background, note the 0 alpha value
        this.scene.getEngine().setHardwareScalingLevel(1 / window.devicePixelRatio);
        

        //set scene background
        this.background = this.#createSceneBackground(this.scene);

        //instantiate device to upload map, prevents multiple simultaneous uploads
        this.deviceToFileUploadNameMap = new Map();

        //add and configure camera...
        const cameras = this.#setupSceneCameras();
        this.sceneCamera = cameras.mainCamera;
        this.sceneCameraReferenceCamera = cameras.referenceCamera;

        //add and configure scene lights and shadows.
        this.sceneLight = this.#setupSceneLightsAndShadows(1);

        //setup scene HDR IBL texture
        const sceneHdrTexture = this.#setupSceneHdrIBLEnvTexture(0.4);

        //configure post-processing rendering pipeline.
        const pipeline = this.#setupRenderingPipeline();
        var glowLayer = new BABYLON.GlowLayer("glowLayer", this.scene)
        glowLayer.intensity = 0.25

        //setup onSceneReady callback handler
        this.#setupSceneReadyHandler();

        //setup mesh selection handler
        this.#setupMeshSelectionHandler();

        //setup colour editor
        this.#setupColorEditor();

        //setup drag and drop panel
        this.#setupDragAndDropPanel();

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

        
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,
            //(this.topShadowingEnabled) ? (Math.PI / 2) - 0.10 : Math.PI / 2, 
            Math.PI / 2,
            1.48,
            BABYLON.Vector3.Zero(),
            this.scene);
        
        //const camera = new BABYLON.ArcRotateCamera("camera", 3 * Math.PI / 4, Math.PI / 4, 4, BABYLON.Vector3.Zero(), this.scene);
        camera.setTarget(BABYLON.Vector3.Zero()); // This targets the camera to scene origin
        camera.lowerBetaLimit = -Math.PI / 264;   // Set the lower vertical rotation limit (to look straight up)
        camera.upperBetaLimit = Math.PI           // Set the upper vertical rotation limit (to look straight down)
        camera.wheelDeltaPercentage = 0.00000000001;
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
        
        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./src/engine/envtextures/studio_small_06_1k.env", this.scene);
        hdrTexture.level = aLevel
        hdrTexture.gammaSpace = true;
        hdrTexture.rotationY = BABYLON.Tools.ToRadians(340); 
        //hdrTexture.rotationY = BABYLON.Tools.ToRadians(45);
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


    #setupSceneReadyHandler() {

        this.scene.executeWhenReady(() => {

            //start main render loop
            this.#startRenderLoop();

            //load demo device mesh
            this.#loadDemoDeviceMesh();
                

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

    #setupDemoDragAndDropHandler(){

    }

    #locateRootMesh(aMesh) {

        if (aMesh.parent == undefined || aMesh.parent == null || aMesh._parentNode == null) {
            return aMesh;
        }

        return this.#locateRootMesh(aMesh.parent);
    }

    #loadDemoDeviceMesh(){

        //const DEMO_DEVICE_MESH_URL = "https://thompsonlabs.bitbucket.io/test-meshes/iphone-14-pro.glb";
        const DEMO_DEVICE_MESH_URL = "https://thompsonlabs.bitbucket.io/test-meshes/iphone-13-pro-max-tagged.glb"

        this.#dispatchBinaryGetRequest(DEMO_DEVICE_MESH_URL)
                    .then((resourceBlob) => {

                        //create blob URL from the returned (IPHONE-14) blob.
                        const resourceBlobURL = URL.createObjectURL(resourceBlob);

                        //known device metadata
                        const deviceMetaData = {
                            "id": "iphone-13-pro",
                            "assetId": "1234",
                            "name": "iphone-13-pro#1",
                            "type": "Device",
                            "bodySubmeshName": "Body_Body_0_12",
                            "bodyMaterialName": ["Body","Camera_Frame.001"],
                            "screenSubmeshName": "Object_25",
                            "screenMaterialName": "Wallpaper",
                            "additionalScreenSubmeshes": [],
                            "bodyColour": "default",
                            "screenTextureURL": "default",
                            "topLevelModelMeshName": "default",
                        }

                        
                        
                        //use the blob URL to instantiate & init a new DeviceMesh instance
                        //NOTE: We pass in KNOWN metadata parameters specific to this particular IPhone-14 mesh
                        const demoDeviceMesh = new DeviceMesh(
                            this.scene,
                            deviceMetaData.name,
                            resourceBlobURL,
                            deviceMetaData.bodySubmeshName,
                            deviceMetaData.bodyMaterialName,
                            deviceMetaData.screenSubmeshName,
                            deviceMetaData.screenMaterialName,
                            deviceMetaData.additionalScreenSubmeshes,
                            deviceMetaData.topLevelModelMeshName,
                            deviceMetaData.bodyColour,
                            deviceMetaData.screenTextureURL
                        );

                        //initialise the device mesh and undertake any initial config..
                        demoDeviceMesh.initialise()
                                      .then((loadedmesh) => {

                                       loadedmesh.parentMesh.rotation.y = Math.PI;

                                       //start rotation animation
                                       this.#animateDemoDeviceMesh(loadedmesh.parentMesh);

                                       //enhance model look for the current environment
                                       this.#enhanceDemoMeshVisualFidelity(loadedmesh);

                                       //store the top-level device mesh for later easy reference as necessary
                                       this.demoDeviceMesh = demoDeviceMesh;
                                       

                                      });

                        
                    })
                    .catch((error) => {
                        LogManager.getInstance().logAll(Level.ERROR, "An error occurred whilst attempting to load demo device mesh ", error)
                        throw error
                    })

                    
    }

    #animateDemoDeviceMesh(mesh){

        // Assuming 'mesh' is your mesh object
        var rotationAnimation = new BABYLON.Animation("rotateAnimation",
            "rotation.y",   // We are animating the Y axis rotation
            15,             // 30 frames per second
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, // Animation type is Float (for a single axis)
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE // Looping mode
        );

        // Keyframes array (frame number, value for Y rotation)
        var keyframes = [
            { frame: 0, value: 0 },             // Start at 0 radians
            { frame: 30, value: Math.PI / 2 },   // Rotate to π/2 radians (90 degrees) at frame 60 (2 seconds in)
            { frame: 60, value: Math.PI },      // Rotate to π radians (180 degrees) at frame 120 (4 seconds in)
            { frame: 90, value: 3 * Math.PI / 2 }, // Rotate to 3π/2 radians (270 degrees) at frame 180 (6 seconds in)
            { frame: 120, value: 2 * Math.PI }   // Complete the full rotation at 2π radians (360 degrees) at frame 240 (8 seconds in)
        ];

    

        // Add keyframes to the animation
        rotationAnimation.setKeys(keyframes);

        // Append the animation to the mesh
        mesh.animations.push(rotationAnimation);

        // Start the animation
        this.scene.beginAnimation(mesh, 0, 120, true); // Loop animation from frame 0 to frame 120


    }

    /*
      
     */
    #enhanceDemoMeshVisualFidelity(mesh){
        
        
        /**
         * What follows are series of demo-device specific configuration settings that
         * together improve the final render of the device by compensating for the
         * super harsh studio lighting applied to the PBR Materials in the scene via
         * the assigned IBL environment texture.
         */
       

        //adjust the material properties of the main deice screen, here we essentially
        //reduce the reflectivity and glare of the screen.
        const screenMaterialName = mesh.getScreenMaterialName();
        const screenMaterial = this.scene.getMaterialById(screenMaterialName);
        screenMaterial.metallic = 0.3;
        screenMaterial.roughness = 0.8;
        screenMaterial.specularIntensity = 1;
        screenMaterial.reflectionColor = new BABYLON.Color3(0.5, 0.5, 0.5); 

        //reduce reflectivity on the body material
        const bodyMaterial = (Array.isArray(mesh.getBodyMaterialName())) 
        ? this.scene.getMaterialByName(mesh.getBodyMaterialName()[0])
        : this.scene.getMaterialByName(mesh.getBodyMaterialName());

        bodyMaterial.reflectionColor = new BABYLON.Color3(0.7, 0.7, 0.7); 

        //disable the device's, additional highly reflective screen
        const screenGlassMesh = this.scene.getMeshByName("Object_43");
        console.log(screenGlassMesh.material)
        screenGlassMesh.setEnabled(false);

        //increase the opacity and reflectivity of the camera lens glass
        const cameraGlass  = this.scene.getMaterialByName("Camera_Glass");
        cameraGlass.alpha = 0.3;
        cameraGlass.roughness = 0.3
    

    }

    #dispatchBinaryGetRequest(aURL) {

        return axios.get(aURL,{ responseType: 'arraybuffer' })
            .then((response) => {
                const blob = new Blob([response.data], {
                    type: 'model/gltf-binary',
                });
                return blob;
            })
            .catch((error) => {
                // handle error
                LogManager.getInstance().log(Level.ERROR, "An error occurred whilst undertaking (binary) GET request",error);
                throw error;
            })
    }

    #setupMeshSelectionHandler(){

        // Register a pointer event to detect picking
        this.scene.onPointerDown = function (evt, pickInfo) {
            if (pickInfo.hit) {
                // pickInfo.pickedMesh contains the mesh that was picked
                console.log("Picked Mesh: ", pickInfo.pickedMesh);
            }else{
                console.log("no hit");
            }
        };

    }

    #setupColorEditor(){

        //instantiate and initialise color editor.
        const colorEditor = new ColorEditor(this.colorEditorTargetElementId);
        colorEditor.initialise();

        //register our listener to be notified of color change events.
        colorEditor.registerColorChangeEventListener((color)=> {

            //update the color of the demo device mesh
            this.demoDeviceMesh.updateBodyColour(color.hexString);
           
        },"engineManagerDefault");

        //store to an instance variable for later reference as necessary.
        this.colorEditor = colorEditor;
    }

    #setupDragAndDropPanel(){

        //instantiate and initialise the drag and drop upload panel
        const dragAndDropPanel = new DragDropPanel(
            this.dragDropPanelTargetElementId,
            500
        )
        dragAndDropPanel.initialise();

        //register our event listener to be notified of file upload events
        dragAndDropPanel.registerDragDropEventListener((file) => {

            //create new blob from the provided file
            const blobURL = URL.createObjectURL(file);

            if (file.type.includes("video")) {

                //dispose of any current video element
                if (this.curVideoElement) {
                    this.#cleanUpVideo(this.curVideoElement);
                }

                //create new video element and set its source to the generated blobURL
                this.curVideoElement = this.#createNewVideoElement(blobURL);

                //reference the demo DeviceMesh and update it's video content
                this.demoDeviceMesh.updateScreenTextureVideo(this.curVideoElement, undefined, true);

                setTimeout(() => {
                    this.curVideoElement.play();
                },1000)
               
            }else{

                this.demoDeviceMesh.updateScreenTextureImage(blobURL,undefined,false);
            }
            
        },"EngineManagerDefault")

        //store reference to the panel for later reference, as necessary.
        this.dragAndDropPanel = dragAndDropPanel;

    }

    #createNewVideoElement(src) {
        const videoElement = document.createElement('video');

        // Set the video element to be hidden
        videoElement.style.display = 'none';

        // Assign a source to the video element
        const videoSource = document.createElement('source');
        videoSource.src = src;  // Replace with your video URL or file path
        videoSource.type = 'video/mp4';  // Set the appropriate video type
        videoElement.appendChild(videoSource);

        // Append the video element to the body or desired container
        document.body.appendChild(videoElement);

        // Optionally, load the video
        videoElement.load();

       

        return videoElement;
    }


    #cleanUpVideo(videoElement) {
        // Stop the video playback
        videoElement.pause();
        
        // Remove the video source
        videoElement.removeAttribute('src');
        
        // Unload the video data
        videoElement.load(); // This will clear the currently loaded video
        
        // Remove event listeners (if any were added)
        const clonedElement = videoElement.cloneNode(true);  // This clones without event listeners
        videoElement.parentNode.replaceChild(clonedElement, videoElement);
    
        // Remove the video element from the DOM
        if (clonedElement.parentNode) {
            clonedElement.parentNode.removeChild(clonedElement);
        }
    
        // Dereference the element to release memory
        videoElement = null;
    }
    

    


}

export { EngineManager }