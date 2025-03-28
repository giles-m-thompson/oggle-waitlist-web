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

  /*
  const dragAndDropContentsDragging = document.getElementById("drag-and-drop-dragging");
  dragAndDropContentsDragging.style.opacity = 0;

  const dragAndDropContents = document.getElementById("drag-and-drop-default");
  dragAndDropContents.classList.remove("hide-panel")
  */

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
  const fileTypes = ["video/mp4","image/png","image/jpg","image/jpeg"];

  if (sizeInMB > 500) {

    showUploadStatus(false, "File Size Exceeds 500Mb");

  } else if (!fileTypes.includes(target.files[0].type)) {

    showUploadStatus(false,"Unsupported File Type");

  } else {

    //show success upload status.
    showUploadStatus(true);

    console.log(target.files[0]);

    //create blob url from file
    const blobURL = URL.createObjectURL(target.files[0]);
    console.log(blobURL);
    //document.getElementById("hero-vid").src = blobURL;


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

const showUploadStatus = (success,msg) => {

  clearPanel();

  if(success){
    const dragAndDropSuccess = document.getElementById("drag-and-drop-success");
    dragAndDropSuccess.style.opacity = 1;
    setTimeout(() => {

      clearPanel();
      const dragAndDropContents = document.getElementById("drag-and-drop-default");
      dragAndDropContents.style.opacity = 1;

    },2500)
  }else{

    const dragAndDropErrorMsg = document.getElementById("drag-and-drop-error-msg");
    const dragAndDropError = document.getElementById("drag-and-drop-error");
    dragAndDropErrorMsg.textContent = msg;
    dragAndDropError.style.opacity = 1;
    setTimeout(() => {

      clearPanel();
      const dragAndDropContents = document.getElementById("drag-and-drop-default");
      dragAndDropContents.style.opacity = 1;

    },3500)



  }


}
