/**
*   Display a custom alert/confirm/prompt to user
*   @param {(String|String[])} message - The info text to display to user
*   @param {{text: string, action: function}[]} buttons - An array of objects, representing buttons.
*   Each object has a `text` property with text to display on button, 
*   and an optional `action` property, which is called
*   when user clicks button.
*/
function UserInfo() {
  this.backgroundPlate = document.createElement('div');
  this.container = document.createElement('div');
  this.infoText = document.createElement('p');
  this.buttonsContainer = document.createElement('div');
  
  this.backgroundPlate.className = "userInfoBackground";
  this.container.className = "userInfoContainer";
  this.infoText.className = "row";
  this.buttonsContainer.className = "row buttons";

  this.container.appendChild(this.infoText);
  this.container.appendChild(this.buttonsContainer);
  this.backgroundPlate.appendChild(this.container);
}

UserInfo.prototype.addMessage = function(message) {
  var lines;
  if (Array.isArray(message)) {
    lines = message.join("<br>");
  } else {
   lines = message; 
  }
  this.infoText.innerHTML = lines;
}

UserInfo.prototype.addButtons = function(buttons) {
  for (var i = 0; i < buttons.length; i++) {
    (function (self) {
      var button = buttons[i];
      var btn = document.createElement('a');
      btn.innerHTML = button.text;
      btn.setAttribute("href", "#");
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        self.dismiss();
        if (typeof(button.action) == 'function') {
          button.action();
        }
      }.bind(self))
      self.buttonsContainer.appendChild(btn);
    })(this);
  }
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

function UserInfoForm() {
  UserInfo.call(this);
  this.form = document.createElement('form');
  this.form.className = "userInfoForm row";
  this.container.insertBefore(this.form, this.buttonsContainer);
}
UserInfoForm.prototype = Object.create(UserInfo.prototype);

UserInfoForm.prototype.addMembers = function (members, currentMemberId) {
  for (var memberId in members) {
    if (members.hasOwnProperty(memberId)) {
      var member = members[memberId];
      (function (self) {
        var checkbox = document.createElement('input');
        var label = document.createElement('label');
        checkbox.type = 'checkbox';
        checkbox.id = 'id_' + member.id;
        checkbox.name = 'id_' + member.id;
        checkbox.value = member.id;
        label.setAttribute('for', checkbox.getAttribute('id'));
        if (memberId == currentMemberId) {
          // Add option to send a reminder to yourself
          label.innerHTML = 'Send to yourself';
          // Make sure it is placed first
          self.form.insertBefore(checkbox, self.form.firstChild);
        } else {
          label.innerHTML = member.name;
          self.form.appendChild(checkbox);
        }
        self.form.appendChild(label);
      })(this);
    }
  }
}
