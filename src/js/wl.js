const BASE_API_URL = "https://api.getwaitlist.com/api/v1";
const WL_ID = 26905;



//obtain reference to various modal and page elements..

//main hero early access button
const heroEarlyAccessBtn = document.getElementById("earlyAccessBtn")


//signup modal
const modal = document.getElementById("signupModal");
const modalSignupBtn = document.getElementById("wlreg_submit");
const overlay = document.querySelector(".overlay");
const openRegisterModalBtn = document.getElementById("waitlist-register-ui-trigger");
const closeRegisterModalBtn = document.querySelector(".btn-close");
const regEmailField = document.getElementById("wlreg_email");
const regEmailErrorTxt = document.getElementById("regEmailError");

//success modal
const successModal = document.getElementById("signupSuccessModal");
const successModalOkBtn = document.getElementById("successModalOkBtn");

//error modal
const errorModal = document.getElementById("signupErrorModal");
const errorModalOkBtn = document.getElementById("errorModalOkBtn");





/**Calls into waitlist API to register user.  */
async function signupUser(email,firstName,waitlistId) {
    const url = BASE_API_URL+"/signup";
    
    const data = {
        email: email.value,
        first_name: firstName.value,
        waitlist_id: waitlistId
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        return result;
    } catch (error) {
        console.error("Error signing up:", error);
    }
}





//assign trigger button that opens Modal
openRegisterModalBtn.addEventListener('click',() => {
    openModal();
});

//assign trigger that closes modal
closeRegisterModalBtn.addEventListener('click',() => {
   closeModal();
});

//assign registration logic to modal submit button
modalSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    doWaitListRegistation();
})

//attach handler to success ok button, to basically close the modal
successModalOkBtn.addEventListener('click', (e) => {
   e.preventDefault();
   closeModal(successModal);
})

//attach handler to error ok button, to basically close the modal
errorModalOkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(errorModal);
})

//attach keydown handler to email text field to clear error status where it exists
regEmailField.addEventListener('keydown', () => {

    if(regEmailField.style.backgroundColor != "white"){
        console.log("reseting error status");
        setEmailErrorStatus(false);
    }

});

//assign logic to scroll to the cta section of the page when the 
//early access button is clicked...
heroEarlyAccessBtn.addEventListener('click',() => {

    setTimeout(() => {
        document.getElementById("cta-section").scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
   }, 100);
    

});




const openModal = (aModal = null) => {
    const targetModal = (aModal == null) ? modal : aModal;
    targetModal.classList.remove("hidden");
    setTimeout(() => {

        targetModal.style.opacity = 1;
    },200)
    
    overlay.classList.remove("hidden");

};

const closeModal = (aModal = null) => {

    const targetModal = (aModal == null) ? modal : aModal;
    targetModal.style.opacity = 0;
   

    setTimeout(() =>{ 
        targetModal.classList.add("hidden");
       //hideRegEmailErrorTxt();
       setEmailErrorStatus(false);
    },500)
    overlay.classList.add("hidden");
  };

const resetRegistrationModal = () => {

    const fname = document.getElementById("wlreg_firstName");
    const email = document.getElementById("wlreg_email");

    fname.value = ""
    email.value = ""
    //hideRegEmailErrorTxt();
    setEmailErrorStatus(false);
    closeModal();

}

const gatherFormDetails =  () => {

    const fname = document.getElementById("wlreg_firstName");
    const email = document.getElementById("wlreg_email");

    const formDetails = {
        "firstName": fname,
        "email":  email
    }

    return formDetails;
}

const doWaitListRegistation = () =>{

    
    //gather form details
    const formDetails = gatherFormDetails();

    //check email
    const emailValid = validateEmail(formDetails.email.value);
    console.log(emailValid);
    if(!emailValid){
        
        //showRegEmailErrorTxt();
        setEmailErrorStatus(true);
        return;
    }

    //call helper function to issue the call to the API to actually register user.
    signupUser(
        formDetails.email,
        formDetails.firstName,
        WL_ID  
    ).then((response) => {


        //finally log success message, complete with UUID returned in the response
        console.log("Signup Successful:", response.uuid);

        //reset and hide the registration modal
        resetRegistrationModal();

        //programatically display success modal
        openModal(successModal);

       

    }).catch((error) => {

        //diaplay error modal.
        console.log(error);

        //reset and hide the registration modal
        resetRegistrationModal();

        //open error modal
        openModal(errorModal);

    })
    

}

const setEmailErrorStatus = (enabled) => {

    console.log(enabled);
    if(enabled){
        showRegEmailErrorTxt();
        setErrorEmailFieldColor(enabled);
    }else{
        hideRegEmailErrorTxt();
        setErrorEmailFieldColor(enabled);
    }


}

const setErrorEmailFieldColor = (enabled) => {

    const formDetails = gatherFormDetails();

    if(enabled){
        formDetails.email.style.backgroundColor = "#f06565";
    }else{
        formDetails.email.style.backgroundColor = "white";
        
    }
}

const showRegEmailErrorTxt = () => {
    regEmailErrorTxt.classList.remove("hidden");
}

const hideRegEmailErrorTxt = () => {
    regEmailErrorTxt.classList.add("hidden");
}

const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};





// Example usage:
//signupUser("example9911@example.com", 26905, "giles", "thompson");
