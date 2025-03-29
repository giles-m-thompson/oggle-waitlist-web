

/**
 * A Drag and Drop Panel UI Component, with integrated support
 * for file size and type restrictions. 
 */
class DragDropPanel{

    constructor(
        targetParentElement,
        maxFileUploadSize,
        supportedFileTypes = ["video/mp4","image/png","image/jpg","image/jpeg"]
    ){

        this.targetParentElement = targetParentElement;
        this.maxFileUploadSize = maxFileUploadSize;
        this.supportedFileTypes = supportedFileTypes;
        this.initialised = false;
        this.listeners = null;
    }

    initialise(){
        this.#buildUI();
        this.listeners = new Map();
        this.initialised = true;
    }

    isInitialised(){
        return this.initialised;
    }


    /** 
   * Registers a new drag drop event listener,the id may be used to unregister the
   * listener at a later time, as necessary.
   */
    registerDragDropEventListener(listener, id) {
        if (!this.isInitialised())
            throw new Error("The component has not been initialised yet.");
        this.listeners.set(id, listener);
    }

    /** Unregisters a previously registered drag drop event  listener.
     * @returns {boolean} True where a listener was actually removed, FALSE otherwise.
     */
    unRegisterDragDropEventListener(listenerId) {
        if (!this.isInitialised())
            throw new Error("The component has not been initialised yet.");
        return this.listeners.delete(listenerId);
    }

    
    #buildUI() {

        // Create the section element
        const section = document.createElement('section');
        section.classList.add('mt-5', 'px-3', 'flex', 'gap-6');
        section.id = 'o3d-demo-drag-and-drop-panel';

        // Create the drag area div
        const dragArea = document.createElement('div');
        dragArea.classList.add('flex-1', 'flex', 'flex-col', 'items-center', 'p-3', 'border-2', 'border-dotted', 'border-gray-300', 'rounded-lg', 'drag-area');
        dragArea.id = 'dragandd';
        dragArea.style.position = 'relative';

        // Create drag-and-drop-default div
        const dragAndDropDefault = document.createElement('div');
        dragAndDropDefault.id = 'drag-and-drop-default';

        // Icon
        const iconWrapper = document.createElement('div');
        iconWrapper.classList.add('gradient-icon-wrapper'); // Add the gradient class
        const defaultIcon = document.createElement('i');
        defaultIcon.classList.add('fa','fa-solid', 'fa-cloud-arrow-up','fa-bounce');
        defaultIcon.style.fontSize = '66px';
        //defaultIcon.style.color = '#535FD7';

        iconWrapper.appendChild(defaultIcon);
        //dragAndDropDefault.appendChild(defaultIcon);
        dragAndDropDefault.appendChild(iconWrapper);

        // Header for default state
        const defaultHeader = document.createElement('header');
        defaultHeader.classList.add('mt-6');

        const defaultSpan = document.createElement('span');
        defaultSpan.classList.add('drag-file');
        defaultSpan.textContent = 'Drag files here ';
        defaultHeader.appendChild(defaultSpan);

        // Button
        const defaultButton = document.createElement('button');
        defaultButton.classList.add('px-2', 'py-1', 'bg-violet-400', 'rounded-full', 'file-input-button');
        defaultButton.textContent = 'select';
        defaultHeader.appendChild(defaultButton);
        defaultHeader.append(' a file.');

        dragAndDropDefault.appendChild(defaultHeader);

        // File type paragraph
        const fileTypeParagraph = document.createElement('p');
        fileTypeParagraph.classList.add('mt-12', 'text-gray-400', 'text-sm');
        fileTypeParagraph.textContent = 'MP4, PNG or JPG only.';
        dragAndDropDefault.appendChild(fileTypeParagraph);

        // Hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.classList.add('file-input');
        fileInput.hidden = true;
        dragAndDropDefault.appendChild(fileInput);

        // Append drag-and-drop-default to dragArea
        dragArea.appendChild(dragAndDropDefault);

        // Create drag-and-drop-dragging div
        const dragAndDropDragging = document.createElement('div');
        dragAndDropDragging.id = 'drag-and-drop-dragging';

        // Icon for dragging state
        const draggingIcon = document.createElement('i');
        draggingIcon.classList.add('fa','fa-solid', 'fa-cloud-arrow-up', 'fa-beat-fade');
        draggingIcon.style.fontSize = '66px';
        draggingIcon.style.color = '#535FD7';
        dragAndDropDragging.appendChild(draggingIcon);

        // Header for dragging state
        const draggingHeader = document.createElement('header');
        draggingHeader.classList.add('mt-6');

        const draggingSpan = document.createElement('span');
        draggingSpan.classList.add('drag-file');
        draggingSpan.textContent = 'Release to Upload';
        draggingSpan.style.position = 'relative';
        draggingSpan.style.top = '-20px';
        draggingHeader.appendChild(draggingSpan);

        dragAndDropDragging.appendChild(draggingHeader);
        dragArea.appendChild(dragAndDropDragging);

        // Create drag-and-drop-success div
        const dragAndDropSuccess = document.createElement('div');
        dragAndDropSuccess.id = 'drag-and-drop-success';

        // Icon for success state
        const successIcon = document.createElement('i');
        successIcon.classList.add('fa-solid', 'fa-circle-check', 'fa-beat-fade');
        successIcon.style.fontSize = '66px';
        successIcon.style.color = '#2fd05f';
        dragAndDropSuccess.appendChild(successIcon);

        // Header for success state
        const successHeader = document.createElement('header');
        successHeader.classList.add('mt-6');

        const successSpan = document.createElement('span');
        successSpan.classList.add('drag-file');
        successSpan.textContent = 'Upload Successful';
        successSpan.style.position = 'relative';
        successSpan.style.top = '-20px';
        successSpan.style.color = 'whitesmoke';
        successHeader.appendChild(successSpan);

        dragAndDropSuccess.appendChild(successHeader);
        dragArea.appendChild(dragAndDropSuccess);

        // Create drag-and-drop-error div
        const dragAndDropError = document.createElement('div');
        dragAndDropError.id = 'drag-and-drop-error';

        // Icon for error state
        const errorIcon = document.createElement('i');
        errorIcon.classList.add('fa-solid', 'fa-circle-exclamation', 'fa-shake');
        errorIcon.style.fontSize = '66px';
        errorIcon.style.color = '#fd3549';
        dragAndDropError.appendChild(errorIcon);

        // Header for error state
        const errorHeader = document.createElement('header');
        errorHeader.classList.add('mt-6');

        const errorSpan = document.createElement('span');
        errorSpan.classList.add('drag-file');
        errorSpan.id = 'drag-and-drop-error-msg';
        errorSpan.textContent = 'Error';
        errorSpan.style.position = 'relative';
        errorSpan.style.top = '-20px';
        errorHeader.appendChild(errorSpan);

        dragAndDropError.appendChild(errorHeader);
        dragArea.appendChild(dragAndDropError);

        // Append the drag area to the section
        section.appendChild(dragArea);

        // Create document images div
        const documentImagesDiv = document.createElement('div');
        documentImagesDiv.id = 'document-images';
        section.appendChild(documentImagesDiv);

        // Create filesize error paragraph
        const fileSizeErrorParagraph = document.createElement('p');
        fileSizeErrorParagraph.classList.add('text-red-700', 'text-sm', 'hidden');
        fileSizeErrorParagraph.id = 'filesize-error';
        fileSizeErrorParagraph.textContent = 'The file size should be less than 5mb';
        section.appendChild(fileSizeErrorParagraph);

        // Create filetype error paragraph
        const fileTypeErrorParagraph = document.createElement('p');
        fileTypeErrorParagraph.classList.add('text-red-700', 'text-sm', 'hidden');
        fileTypeErrorParagraph.id = 'filetype-error';
        fileTypeErrorParagraph.textContent = 'The file should be an image or pdf only';
        section.appendChild(fileTypeErrorParagraph);

        // Append section to parent container
        const parentEle = this.#resolveElement(this.targetParentElement);
        if(!parentEle)
            throw new Error("Unable to complete build of DragDropPanel; the specified parent element could not be found.");
        parentEle.appendChild(section);

        //finally setup event handling for drag/drop events.
        this.#setupEventHandling();

    }

    #setupEventHandling() {

        //selecting all required elements
        const dropArea = document.querySelector(".drag-area"),
            dragFile = dropArea.querySelector(".drag-file"),
            button = dropArea.querySelector(".file-input-button"),
            input = dropArea.querySelector(".file-input");

        let documentImages = document.querySelector("#document-images");

        /*
        * When the user clicks the previous button, the current section is hidden and the previous section is
        * shown.
        * @param sectionContainer - the section that is currently being displayed
        */
        const prevButtonNavigation = (sectionContainer) => {
            sectionContainer.classList.add("hidden");
            sectionContainer.previousElementSibling.classList.add("block");
            sectionContainer.previousElementSibling.classList.remove("hidden");
        };

        /*
        * When the next button is clicked, hide the current section and show the next section.
        * @param sectionContainer - the section that is currently being displayed
        */
        const nextButtonNavigation = (sectionContainer) => {
            sectionContainer.classList.add("hidden");
            sectionContainer.nextElementSibling.classList.add("block");
            sectionContainer.nextElementSibling.classList.remove("hidden");
        };

        // Files array to check whether there is any file 
        // selected or not
        let documentFileObj = {
            fileName: []
        };


        // Input validation to check whether the fileName
        // array in documentFileObj has any file or not and
        // throw the error accordingly
        const validationInputs = (container, dataObject) => {
            const errorMessage = container.querySelector("#input-empty-error");
            const emptyFields = [];
            for (const key in dataObject) {
                if (dataObject[key].length <= 0) {
                    emptyFields.push(key.toUpperCase());
                }
            }
            errorMessage.textContent = `Please fill ${emptyFields.join()} fields!!`;
            errorMessage.classList.remove("hidden");
            setTimeout(() => {
                errorMessage.classList.add("hidden");
            }, 2000);
        };



        button.onclick = () => {
            input.click(); //if user click on the button then the input also gets clicked
        };

        input.addEventListener("change", function (e) {
            const target = e.target;
            setttingFileValue(target);
        });

        // Finding the document closest to the delete button and removing it from the list
        documentImages.addEventListener("click", (e) => {
            const target = e.target;
            const deleteFileButton = target.closest(".delete-document");
            const documentsWrapper = target.closest("#document-images");
            const documentToDelete = target.closest(".document-file");
            const documentName = documentToDelete.firstElementChild.children[1].innerText;

            if (deleteFileButton === null) return;

            /* This is finding the index of the file name in the documentFileObj object. */
            const index = documentFileObj["fileName"].find((x) => x === documentName);
            /* This is removing the file name from the documentFileObj object. */
            documentFileObj["fileName"].splice(index, 1);
            documentsWrapper.removeChild(documentToDelete);
        });

        /**
        * If the file type is jpg, jpeg, or png, return the text-violet-600 fa-image class. Otherwise, return
        * the text-red-600 fa-file-pdf class.
        * @param fileType - The file type of the file.
        * @returns A function that takes a fileType as an argument and returns a string.
        */
        const fileTypeLogo = (fileType) => {
            if (fileType === "jpg" || fileType === "jpeg" || fileType === "png") {
                return "text-violet-600 fa-image";
            } else {
                return "text-red-600 fa-file-pdf";
            }
        };

        // //If user Drag File Over DropArea
        /* This is an event listener. It is listening for the dragover event. When the dragover event is
        triggered, it will prevent the default behavior, add the active class to the dropArea element, and
        change the text of the dragFile element. */
        dropArea.addEventListener("dragover", (event) => {
            event.preventDefault(); //preventing from default behaviour


            clearPanel();

            const dragAndDropContentsDragging = document.getElementById("drag-and-drop-dragging");
            dragAndDropContentsDragging.style.opacity = 1;
        });

        // //If user leave dragged File from DropArea
        /* This is an event listener. It is listening for the dragleave event. When the dragleave event is
        triggered, it will remove the active class from the dropArea element and change the text of the
        dragFile
        element. */
        dropArea.addEventListener("dragleave", (event) => {
            event.preventDefault();
            const dragAndDropContentsDragging = document.getElementById("drag-and-drop-dragging");
            dragAndDropContentsDragging.style.opacity = 0;

            const dragAndDropContents = document.getElementById("drag-and-drop-default");
            dragAndDropContents.style.opacity = 1;

        });

        //If user drop File on DropArea
        /* This is an event listener. It is listening for the drop event. When the drop event is triggered, it
        will prevent the default behavior, remove the active class from the dropArea element, change the
        text of the dragFile element, and call the setttingFileValue function. */
        dropArea.addEventListener("drop", (e) => {
            e.preventDefault();

            //restore the UI to pre-drag
            const target = e.dataTransfer;
            setttingFileValue(target);
        });

        // Navigation part
        /* This is an event listener. It is listening for the click event. When the click event is triggered,
        it will check if the target is the nextButton or prevButton. If it is the nextButton, it will check
        if the documentFileObj object has a fileName property. If it does, it will call the
        nextButtonNavigation function. If it does not, it will show an alert. If the target is the
        prevButton, it will call the prevButtonNavigation function. */
        document.querySelector("body").addEventListener("click", (e) => {
            const target = e.target;
            const prevButton = target.closest(".document-prev-button");
            const nextButton = target.closest(".document-next-button");
            const sectionContainer = target.closest(".section-container");

            if (nextButton) {
                if (documentFileObj["fileName"].length !== 0) {
                    nextButtonNavigation(sectionContainer);
                } else {
                    validationInputs(sectionContainer, documentFileObj);
                }
            }

            if (prevButton) {
                prevButtonNavigation(sectionContainer);
            }
        });


        const setttingFileValue = (target) => {
            /*getting user select file and [0] this means if user select multiple files then we'll select only the first one
               This is getting the file name, file size, and file type. */
            const fileName = target.files[0].name;
            const fileSize = target.files[0].size;
            const fileType = target.files[0].type.split("/").pop(); //fetching only the part after slash


            /* This is checking the file size. If the file size is greater than 5mb, it will show an error
              message. */
            const sizeInMB = Number.parseFloat(fileSize / (1024 * 1024)).toFixed(2);

            /* This is checking the file type. If the file type is not pdf or image, it will show an error message. */
            const fileTypes = this.supportedFileTypes;

            if (sizeInMB > this.maxFileUploadSize) {

                showUploadStatus(false, "File Size Exceeds 500Mb");

            } else if (!fileTypes.includes(target.files[0].type)) {

                showUploadStatus(false, "Unsupported File Type");

            } else {

                //show success upload status.
                showUploadStatus(true);

                //console.log(target.files[0]);

                //create blob url from file
                //const blobURL = URL.createObjectURL(target.files[0]);
                //console.log(blobURL);
                //document.getElementById("hero-vid").src = blobURL;
                this.#notifyListeners(target.files[0]);


            }
        };

        const clearPanel = () => {

            const dragAndDropContentsDragging = document.getElementById("drag-and-drop-dragging");
            dragAndDropContentsDragging.style.opacity = 0;

            const dragAndDropContents = document.getElementById("drag-and-drop-default");
            dragAndDropContents.style.opacity = 0;

            const dragAndDropSuccess = document.getElementById("drag-and-drop-success");
            dragAndDropSuccess.style.opacity = 0;

            const dragAndDropError = document.getElementById("drag-and-drop-error");
            dragAndDropError.style.opacity = 0;

        }

        const showUploadStatus = (success, msg) => {

            clearPanel();

            if (success) {
                const dragAndDropSuccess = document.getElementById("drag-and-drop-success");
                dragAndDropSuccess.style.opacity = 1;
                setTimeout(() => {

                    clearPanel();
                    const dragAndDropContents = document.getElementById("drag-and-drop-default");
                    dragAndDropContents.style.opacity = 1;

                }, 2500)
            } else {

                const dragAndDropErrorMsg = document.getElementById("drag-and-drop-error-msg");
                const dragAndDropError = document.getElementById("drag-and-drop-error");
                dragAndDropErrorMsg.textContent = msg;
                dragAndDropError.style.opacity = 1;
                setTimeout(() => {

                    clearPanel();
                    const dragAndDropContents = document.getElementById("drag-and-drop-default");
                    dragAndDropContents.style.opacity = 1;

                }, 3500)



            }


        }


    }


    #resolveElement(elementName){
        return document.getElementById(elementName);
    }


    #notifyListeners(file){
        this.listeners
            .forEach((listener) => {
                listener(file);
            })
    }


}


export {DragDropPanel}