
var ROOT = document.querySelector("html");

var newFolderInput = document.querySelectorAll("#new-folder-input")[0];
var newFileInput = document.querySelector("#new-file-input");

var newFileButton = document.querySelector(".new-file-button");
var newFolderButton = document.querySelector(".new-folder-button");

var folder = true;
var file = true;


ROOT.addEventListener("click", () => {
    //alert("ROOT");
    if (folder) {
        newFolderInput.style.visibility = "hidden";
        newFolderInput.style.height = "0";
        newFolderInput.style.width = "0";
    }

    if (file) {
        newFileInput.style.visibility = "hidden";
        newFileInput.style.height = "0";
        newFileInput.style.width = "0";
    }

    file = true;
    folder = true;
});

newFolderButton.addEventListener("click", () => {
    //alert("Folder Button");
    newFolderInput.style.visibility = "visible";
    newFolderInput.style.minHeight = "50vh";
    newFolderInput.style.width = "30vw";

    newFileInput.style.visibility = "hidden";
    newFileInput.style.height = "0";
    newFileInput.style.width = "0";

    folder = false;
    file = true;
});

newFileButton.addEventListener("click", () => {
    //alert("File Button");
    newFileInput.style.visibility = "visible";
    newFileInput.style.minHeight = "50vh";
    newFileInput.style.width = "30vw";

    newFolderInput.style.visibility = "hidden";
    newFolderInput.style.height = "0";
    newFolderInput.style.width = "0";

    file = false;
    folder = true;
});

