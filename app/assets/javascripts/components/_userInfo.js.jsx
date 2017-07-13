/**
*   Display a custom alert/confirm/prompt to user
*   @param {string} text - The info text to display
*   @param {string} btnText1 - Text to display on first button
*   @param {function} okAction - invoked when user presses first button
*   @param {string} [btnText2] - Text to display on second button
*   @param {function} [cancelAction] - invoked when user presses second button
*/
function UserInfo(text, btnText1, okAction, btnText2, cancelAction) {
  this.backgroundPlate = document.createElement('div');
  var container = document.createElement('div');
  var infoText = document.createElement('p');
  var buttons = document.createElement('div');
  var okButton = document.createElement('a');
  var cancelButton = document.createElement('a');
  
  this.backgroundPlate.className = "userInfoBackground";
  container.className = "userInfoContainer";
  infoText.className = "row";
  buttons.className = "row buttons";
  
  var message = text;
  if (Array.isArray(text)) {
    message = text.join("<br>");
  }
  infoText.innerHTML = message;
  okButton.innerHTML = btnText1;
  okButton.setAttribute("id", "btn1");
  okButton.setAttribute("href", "#");
  buttons.appendChild(okButton);

  if (btnText2 !== undefined) {
    cancelButton.innerHTML = btnText2;
    cancelButton.setAttribute("id", "btn2");
    cancelButton.setAttribute("href", "#");
    buttons.appendChild(cancelButton);
  }
  
  buttons.addEventListener("click", function(e) {
    e.preventDefault();
    switch (e.target.id) {
      case "btn1":
        this.dismiss();
        if (typeof(okAction) == 'function') okAction();
      break;
      case "btn2":
        this.dismiss();
        if (typeof(cancelAction) == 'function') cancelAction();
      break;
    }
  }.bind(this));
  
  container.appendChild(infoText);
  container.appendChild(buttons);
  this.backgroundPlate.appendChild(container);
}

UserInfo.prototype.present = function(parent) {
  parent.appendChild(this.backgroundPlate);
}

UserInfo.prototype.dismiss = function() {
  this.backgroundPlate.querySelector(".userInfoContainer").style.animation = "shrink 190ms ease-in";
  this.backgroundPlate.style.opacity = 0;
  setTimeout(function () {
    this.backgroundPlate.parentNode.removeChild(this.backgroundPlate);
  }.bind(this), 200);
}