// ==UserScript==
// @name         TeamSupport API
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds bulk Resolved Version for tickets in More dropdown
// @author       Gloria
// @grant        none
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Dashboard*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/TicketTabs*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Tasks*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/KnowledgeBase*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Wiki*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Search*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/WaterCooler*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Calendar*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Users*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Groups*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Customer*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Product*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Asset*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Report*
// @exclude      https://app.teamsupport.com/vcr/*/TicketPreview*
// @exclude      https://app.teamsupport.com/vcr/*/Images*
// @exclude      https://app.teamsupport.com/vcr/*/images*
// @exclude      https://app.teamsupport.com/vcr/*/Audio*
// @exclude      https://app.teamsupport.com/vcr/*/Css*
// @exclude      https://app.teamsupport.com/vcr/*/Js*
// @exclude      https://app.teamsupport.com/Services*
// @exclude      https://app.teamsupport.com/frontend*
// @exclude      https://app.teamsupport.com/Frames*
// @match        https://app.teamsupport.com/vcr/*
// @require      //maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css
// @require      https://cdn.jsdelivr.net/bootstrap.native/2.0.1/bootstrap-native.js

// ==/UserScript==

// constants
var url = "https://app.teamsupport.com/api/xml/";
var orgID = "";
var token = "";

document.addEventListener('DOMContentLoaded', main(), false);

function createModal(){
    // create Resolved Versions modal pop up
    var modal = document.createElement("div");
    modal.className = "modal fade";
    modal.setAttribute("id", "resolveModal");
    modal.role = "dialog";
    modal.setAttribute("tabindex", -1);
    modal.setAttribute("aria-labelledby", "resolveModal");
    modal.setAttribute("aria-hidden", true);
    document.body.appendChild(modal);

    var modalDialog = document.createElement("div");
    modalDialog.className = "modal-dialog";
    modalDialog.setAttribute("role","document");
    modal.appendChild(modalDialog);

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalDialog.appendChild(modalContent);

    //create modal header
    var modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalContent.appendChild(modalHeader);

    // create header title
    var header = document.createElement("h4");
    header.className = "modal-title";
    var hText = document.createTextNode("Resolve Version");
    header.appendChild(hText);
    modalHeader.appendChild(header);

    // create header close button
    var hbutton = document.createElement("button");
    hbutton.setAttribute("type", "button");
    hbutton.className = "close";
    hbutton.setAttribute("data-dismiss", "modal");
    hbutton.setAttribute("aria-label", "Close");
    var span = document.createElement("span");
    span.setAttribute("aria-hidden", true);
    span.innerHTML = "&times;";
    hbutton.appendChild(span);
    modalHeader.appendChild(hbutton);

    // create dropdown within modal body
    var modalBody = document.createElement("div");
    modalBody.className="modal-body";
    modalBody.id = "resolve-body";
    modalContent.appendChild(modalBody);

    //create modal footer
    var modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalContent.appendChild(modalFooter);

    // create save and close buttons in modal footer
    var sbtn = document.createElement("button");
    var save = document.createTextNode("Resolve Version");
    sbtn.appendChild(save);
    sbtn.id = "save-btn";
    sbtn.type = "button";
    sbtn.setAttribute("data-dismiss", "modal");
    sbtn.className = "btn btn-primary";
    var cbtn = document.createElement("button");
    var close = document.createTextNode("Close");
    cbtn.appendChild(close);
    cbtn.type = "button";
    cbtn.className = "btn btn-secondary";
    cbtn.setAttribute("data-dismiss", "modal");
    modalFooter.appendChild(sbtn);
    modalFooter.appendChild(cbtn);
}

function main(){
    if(document.getElementsByClassName('btn-toolbar').length == 1){
        // create resolve version button in dropdown
        var ul = document.getElementsByClassName("dropdown-menu ticket-menu-actions")[0];
        ul.removeAttribute("aria-expanded");
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.appendChild(document.createTextNode("Resolved Version"));
        a.setAttribute("class", "ticket-action-resolved");
        a.setAttribute("href", "#");
        a.setAttribute("data-toggle", "modal");
        a.setAttribute("data-target", "#resolveModal");
        li.appendChild(a);
        ul.appendChild(li);

        // create initial modal
        createModal();

        //if Resolve Version button clicked, clear modal contents then replace modal contents appropriately
        a.addEventListener('click', function(e){
            e.preventDefault();
            var sel = document.getElementById('resolve-body');
            if(sel) sel.innerHTML = "";
            resolve();
        });
    }
}

function resolve(){
    // get tickets that are selected and parse through the xml to add them to a ticket array
    var tickets = new Array();
    var elements = document.getElementsByClassName('slick-cell l6 r6 ticket-grid-cell-ticketnumber selected');
    var len = elements.length;
    for(var i=0; i<len; ++i){
        var ele = elements[i].innerHTML;
        var ticket = ele.substring(ele.indexOf(">")+1, ele.lastIndexOf("<"));
        tickets.push(ticket);
    }

    // initialize XMLHttpRequest and DOMParser
    var xhr = new XMLHttpRequest();
    var parser = new DOMParser();

    // compare the ticket products and either get the product's versions or create a warning alert
    var versions = compareProducts(tickets, len, xhr, parser);

    var modalBody = document.getElementById("resolve-body");
    if((typeof versions) != 'string'){
        //products match so replace modal contents with drop down with versions
        var dropdown = document.createElement("div");
        dropdown.className = "form-group";
        var dlabel = document.createElement("label");
        dlabel.setAttribute("for","form-select");
        dlabel.innerHTML = "Select a Resolved Version";
        var dselect = document.createElement("select");
        dselect.className = "form-control";
        dselect.setAttribute("id", "form-select");

        dropdown.appendChild(dlabel);
        dropdown.appendChild(dselect);
        modalBody.appendChild(dropdown);

        for(var n=0; n<versions.value.length; ++n){
            var option = document.createElement("option");
            option.setAttribute("value", versions.value[n].innerHTML);
            option.innerHTML = versions.name[n].innerHTML;
            dselect.appendChild(option);
        }

        // if Save was clicked then send a post request
        document.getElementById('save-btn').onclick = function saveVersion() {
            var sel = document.getElementById('form-select');
            var versionValue = sel.value;
            var versionName = sel.options[sel.selectedIndex].text;
            putResolvedVersions(tickets, versionValue, versionName, len, xhr, parser);
        }
    }else{
        //products don't match or no product exists, so replace modal contents with error message
        modalBody.innerHTML = versions;
    }
}

function compareProducts(tickets, len, xhr, parser){
    // create array of product ids
    var error = false;
    var products = new Array();
    var productNames = new Array();
    var errorMessage = "Ensure ticket products are the same before assigning them the same resolved version.<br /><b>Ticket # &emsp; &ensp;Product</b>";

    // get product of each of the tickets to ensure they are tickets for the same product
    for(var n=0; n<len; ++n){
        // get product id with XMLHttpRequest, then add it to the product id array
        var queryURL = url + "tickets/" + tickets[n];
        xhr.open("GET", queryURL, false, orgID, token);
        xhr.send();
        var xmlDoc = parser.parseFromString(xhr.responseText,"text/xml");
        var productID = xmlDoc.getElementsByTagName("ProductID")[0].innerHTML;
        var productName = xmlDoc.getElementsByTagName("ProductName")[0].innerHTML;

        // return error message if product id doesn't exist in ticket
        if(productID == ""){
            return "No product assigned to the tickets.";
        }

        // add product id to products array and add ticket data to the error message
        products.push(productID);
        productNames.push(productName);
        errorMessage += "<br />"+tickets[n] +"&emsp; &emsp; &emsp;" + productNames[n] + "";

        //check if products are equal on the tickets
        if(products.length == 1){
            var prev = productID;
        }else if(productID == prev){
            continue;
        }else{
            error = true;
        }
    }

    if(error){
        return errorMessage;
    }else{
        // all products are equal, so get versions
        var versions = getProductVersions(products[0], xhr, parser);
        return versions;
    }
}

function getProductVersions(product, xhr, parser){
    //get product versions and parse through xml tags
    var versions = new Array();
    var versionValues = new Array();
    var URL = url + "Products/" + product + "/Versions";
    xhr.open("GET", URL, false, orgID, token);
    xhr.send();
    var xmlDoc = parser.parseFromString(xhr.responseText,"text/xml");
    var xmlVersionNames = xmlDoc.getElementsByTagName("VersionNumber");
    var xmlVersionID = xmlDoc.getElementsByTagName("ProductVersionID");

    return {
        name: xmlVersionNames,
        value: xmlVersionID
    };
}

function putResolvedVersions(tickets, versionValue, versionName, len, xhr, parser){
    var data =
        '<Ticket>' +
            '<SolvedVersionID>' + versionValue + '</SolvedVersionID>' +
            '<SolvedVersion>' + versionName + '</SolvedVersion>'+
        '</Ticket>';
    var xmlData = parser.parseFromString(data,"text/xml");

    // loop through the tickets array and update their versions
    for(var t=0; t<len; ++t){
        var putURL = url + "tickets/" + tickets[t];
        xhr.open("PUT", putURL, false, orgID, token);
        xhr.send(xmlData);
    }

    //force reload so website reflects resolved version change
    location.reload(true);
}
