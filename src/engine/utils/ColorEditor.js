
/**
 * Utility component that provides a robust colour editing UI
 * via a full-spectrum RGB Colour Wheel and associated sliders to
 * further fine-tine the shade/hue of a selected colour. 
 * 
 * The component also supports the registration of one or more listeners to be notified
 * when a colour change event occurs via the main colour wheel or indeed any one
 * of the three, color fine-tuning sliders.
 * @class ColorEditor
 * @author Giles Thompson
 * 
 */
class ColorEditor{

    constructor(targetElementId){
        this.targetElementId = targetElementId;
        this.initialised = false;
        this.colorPicker;
        this.listeners;
        
    }

    /**Initialises the component and prepares it for use. */
    initialise(){
        this.#buildUI();
        this.listeners = new Map();
        this.initialised = true;
    }

    isInitialised(){
        return this.initialised;
    }

     
    /** 
     * Registers a new color change event listener,the id may be used to unregister the
     * listener at a later time, as necessary.
     */
    registerColorChangeEventListener(listener,id){
        if(!this.isInitialised())
            throw new Error("The component has not been initialised yet.");
        this.listeners.set(id,listener);
    }

    /** Unregisters a previously registered color change listener.
     * @returns {boolean} True where a listener was actually removed, FALSE otherwise.
     */
    unRegisterColorChangeEventListener(listenerId){
        if(!this.isInitialised())
            throw new Error("The component has not been initialised yet.");
        return this.listeners.delete(listenerId);
    }



    //builds UI and appends it as a child of the supplied target element.
    #buildUI() {

        // Create the main container div
        const colorEditorDiv = document.createElement('div');
        colorEditorDiv.id = 'o3d-demo-color-editor';

        // Create the picker div
        const pickerDiv = document.createElement('div');
        pickerDiv.id = 'picker';

        // Create the IroColorPicker div inside picker
        const iroColorPickerDiv = document.createElement('div');
        iroColorPickerDiv.className = 'IroColorPicker';
        iroColorPickerDiv.style.display = 'block';

        // Append the IroColorPicker div to the picker div
        pickerDiv.appendChild(iroColorPickerDiv);

        // Create the color editor text container div
        const colorEditorTextDiv = document.createElement('div');
        colorEditorTextDiv.id = 'o3d-demo-color-editor-text';

        // Create the SVG for bend text
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('bendtext');

        // Create the defs element for the SVG paths
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Create the first path
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.id = 'line1';
        path1.setAttribute('d', 'M 0,300 A 200,200 0 0 1 400,300');

        // Create the second path
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.id = 'line2';
        path2.setAttribute('d', 'M 0,300 A 200.75,200 0 0 1 400,300');

        // Append both paths to defs
        defs.appendChild(path1);
        defs.appendChild(path2);

        // Create the text element
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');

        // Create the textPath element for the text
        const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        textPath.setAttribute('startOffset', '50%');
        textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#line1');
        textPath.textContent = 'Change Colour';

        // Append the textPath to the text element
        textElement.appendChild(textPath);

        // Append defs and text to the SVG
        svg.appendChild(defs);
        svg.appendChild(textElement);

        // Append the SVG to the color editor text div
        colorEditorTextDiv.appendChild(svg);

        // Create the arrow image
        const arrowImg = document.createElement('img');
        arrowImg.id = 'o3d-demo-color-editor-arrow';
        arrowImg.src = './src/images/arrow.png';

        // Append everything to the main container div
        colorEditorDiv.appendChild(pickerDiv);
        colorEditorDiv.appendChild(colorEditorTextDiv);
        colorEditorDiv.appendChild(arrowImg);

        // Append the entire color editor to the target element
        const targetElement = this.#resolveElement(this.targetElementId);
        targetElement.appendChild(colorEditorDiv);

        //prepare the actual color picker component
        this.colorPicker = this.#instantiateAndConfigureColorPicker();
   
        

    }

    #instantiateAndConfigureColorPicker() {

        const colorPicker = new iro.ColorPicker('#picker', {
            width: 180,
            color: 'hsla(341, 100%, 85%, 1)',
            padding: 10,
            borderWidth: 2.5,
            handleRadius: 10,
            wheelLightness: false,
            layout: [
                {
                    component: iro.ui.Wheel,
                    options: {},
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: 'hue',
                    },
                },
                {
                    component: iro.ui.Slider,
                    sliderType: 'value',
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: 'saturation',
                    },
                },
            ],
        });

        //crucially register our on color change listener this will be used to
        //drive production of colour change events to listeners of THIS class.
        colorPicker.on('color:change', (color) => {
            this.#notifyListeners(color)
        });

        return colorPicker;

    }


    #resolveElement(elementName){
        return document.getElementById(elementName);
    }


    #notifyListeners(color){
        this.listeners
            .forEach((listener) => {
                listener(color);
            })
    }

}

export {ColorEditor}