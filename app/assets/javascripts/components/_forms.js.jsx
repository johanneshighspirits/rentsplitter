var abfRentDiscountRegex = /\d{3}:\d{4}:\d/gi;

function idEncode(attribute) {
  return attribute.replace(/\[/g, "_").replace(/\]/g, "");
}

var Form = React.createClass({
  getInitialState: function(){
    var c = this.setupFields(this.props.fields);
    return({
      members: this.props.members,
      controllers: c.controllers,
      controlValues: c.controlValues,
      fields: this.props.fields
    });
  },
  componentDidMount: function(){
    var c = this.setupFields(this.state.fields);
    this.setState({
      controllers: c.controllers,
      controlValues: c.controlValues,
    });
  },
  setupFields: function(fields){
    var controllers = {};
    var controlValues = {};
    fields.forEach(function(item){
      // Add value to controlValues
      switch (item.fieldType) {
        case "select":
        case "select_noLabel":
        case "text":
        case "textarea":
        case "email":
        case "password":
        case "number":
        case "date":
        case "hidden":
        case "checkbox":
        case "file":
          controlValues[item.attribute] = {
            pristine: true,
            valid: item.validations === undefined ? true : this.validate(item.defaultValue, item.validations).valid,
            value: item.defaultValue !== undefined ? item.defaultValue : "",
            validations: item.validations,
            formError: item.validations !== undefined ? item.validations[0].message : "Error"
          };
        break;
        case "radio":
          controlValues[item.attribute] = {
            pristine: true,
            valid: item.validations === undefined,
            value: item.checked ? item.defaultValue : "",
            validations: item.validations,
            formError: item.validations !== undefined ? item.validations[0].message : "Error"
          };
        break;
        case "flex-items":
          item.items.forEach(function(flexItem) {
            switch (flexItem.fieldType) {
              case "radio":
                if (controlValues[flexItem.attribute] === undefined) {
                  controlValues[flexItem.attribute] = {
                    pristine: true,
                    valid: flexItem.validations === undefined ? true : this.validate(flexItem.defaultValue, flexItem.validations).valid,
                    value: flexItem.checked ? flexItem.defaultValue : "",
                    validations: flexItem.validations,
                    formError: flexItem.validations !== undefined ? flexItem.validations[0].message : "Error"
                  };
                }else if (flexItem.checked){
                  controlValues[flexItem.attribute].value = flexItem.defaultValue;
                }
              break;
              case "select":
                controlValues[flexItem.attribute] = {
                  pristine: true,
                  valid: flexItem.validations === undefined ? true : this.validate(flexItem.defaultValue, flexItem.validations).valid,
                  value: flexItem.defaultValue,
                  validations: flexItem.validations,
                  formError: flexItem.validations !== undefined ? flexItem.validations[0].message : "Error"
                };
              break;
            }
          });
        break;
        default:
          console.log("Ignored: " + item.attribute + ", of type " + item.fieldType);
        break;
      }

      if (item.isControlling !== undefined) {
        if (controllers[item.attribute] === undefined) {
          controllers[item.attribute] = [{
            id: item.attribute,
            controlType: item.controlType,
            targetId: item.isControlling,
            targetAction: item.targetAction,
            fieldValue: item.defaultValue
          }];
        }else{
          controllers[item.attribute].push({
            id: item.attribute,
            controlType: item.controlType,
            targetId: item.isControlling,
            targetAction: item.targetAction,
            fieldValue: item.defaultValue
          });          
        }
      }
    }, this);
    return ({
      controllers: controllers,
      controlValues: controlValues
    });
  },
  // pluralize: function(str) {
  //   return str.replace("_id", "s");
  // },
  generateUrl: function(template, value) {
    return template.replace(":id", value);
  },
  // getInitialState: function() {
  //   return ({
  //     pristine: true,
  //     valid: false,
  //     formError: ""
  //   });
  // },
  validateForm: function(e) {
    if (!this.state.dontValidate) {
      var isValid = true;
      var controlValues = this.state.controlValues;
      var errorPosition = 0;
      var scroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      Object.keys(controlValues).forEach(function(key) {
        var element = document.getElementById(idEncode(key));
        if (element !== null) {
          // Set pristine to false to ensure that formError message is shown
          controlValues[key].pristine = false;
          // If input field is undefined, set to false and add formError message
          if (controlValues[key].valid === undefined) {
            controlValues[key].valid = false;
            controlValues[key].formError = controlValues[key].validations !== undefined ? controlValues[key].validations[0].message : "Error";
          }
          // If one of the fields is invalid the form is invalid.
          if (controlValues[key].valid === false) {
            var pos = element.getBoundingClientRect().top + scroll - 20;
            if (errorPosition === 0) {
              errorPosition = pos;
            }else if (pos < errorPosition) {
              errorPosition = pos;
            }
            if (errorPosition == pos) {
              console.log("focus on " + element);
              element.focus();
            }
            isValid = false;
          }
          console.log("Validating " + key + ": " + controlValues[key].valid);
        }
      }, this);

      // Prevent form from submitting if invalid
      if (!isValid) {
        e.preventDefault();
        window.scrollTo(0, errorPosition);
        this.setState({
          controlValues: controlValues
        });
      }    
    }
  },
  validate: function(value, validations) {
    var valid = false;
    var message = "";
    if (validations === undefined) {
      return {
        valid: true,
        message: message
      };
    }
    validations.forEach(function(validation, i){
      switch (validation.type) {
        case "presence":
        console.log(value);
          valid = value !== "" && value !== undefined;
          message = value !== "" ? "" : validation.message;
          console.log(validation.type + ": " + valid);
        break;
        case "length>":
          valid = value.length > validation.limit;
          message = value.length > validation.limit ? "" : validation.message;
          console.log(validation.type + ": " + valid);
        break;
        case "value>":
          valid = value > validation.limit;
          message = value > validation.limit ? "" : validation.message;
          console.log(validation.type + ": " + valid);
        break;
        case "email":
          valid = /^[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+$/i.test(value);
          message = valid ? "" : validation.message;
          console.log(validation.type + ": " + valid);
        break;
        default:
          valid = true;
        break;
      }
    });
    return {
      valid: valid,
      message: message
    };
  },
  handleChange: function(e) {
    var controlValues = this.state.controlValues;
    if (this.state.controlValues[e.target.name] !== undefined) {
      switch (e.target.type) {
        case "checkbox":
          controlValues[e.target.name].value = !controlValues[e.target.name].value;
          var validation = this.validate(e.target.value, this.state.controlValues[e.target.name].validations);
          controlValues[e.target.name].pristine = false;
          controlValues[e.target.name].valid = validation.valid;
          controlValues[e.target.name].formError = validation.message;
        break;
        case "file":
          controlValues[e.target.name].value = e.target.value;
          this.parseExcelFile(e);
        break;
        case "email":
          controlValues[e.target.name].value = e.target.value;
          /*
          Only validate email if it's invalid. Validate on blur event.
          That way error messages will disappear when email is valid
          but won't show up until writing is done and field is blurred.
          */
          if (!controlValues[e.target.name].valid && !controlValues[e.target.name].pristine) {
            var validation = this.validate(e.target.value, this.state.controlValues[e.target.name].validations);
            controlValues[e.target.name].pristine = false;
            controlValues[e.target.name].valid = validation.valid;
            controlValues[e.target.name].formError = validation.message;
          }
        break;
        default:
          controlValues[e.target.name].value = e.target.value;
          var validation = this.validate(e.target.value, this.state.controlValues[e.target.name].validations);
          controlValues[e.target.name].pristine = false;
          controlValues[e.target.name].valid = validation.valid;
          controlValues[e.target.name].formError = validation.message;
        break;
      }
    }

    if (this.state.controllers[e.target.name] !== undefined) {
      var controller = this.state.controllers[e.target.name];
      switch (controller[0].controlType) {
        case "select":
        // This Select is controlling another one, meaning that when
        // this value changes, the other value should change too.
        var url = this.generateUrl(e.target.dataset.controlurl, e.target.value);
        $.get(url, function(results){
          var fields = this.state.fields.map(function(item, i){
            if (item.attribute == controller[0].targetId) {
              item.options = results;
              controlValues[item.attribute].value = results[0][0];
              controlValues[item.attribute].valid = this.validate(results[0][0], item.validations);
            }
            return item;
          }, this);
          this.setState({
            fields: fields
          }, function(){
            // Validate the newly added field
            this.setupFields(this.state.fields);
          });
        }.bind(this), 'json');
        break;
      }
    }
    this.setState({
      controlValues: controlValues
    });      
  },
  handleBlur: function(e) {
    if (e.target.type == "email" && e.target.value !== "") {
      console.log("HANDLE BLUR for " + e.target.id);
      var controlValues = this.state.controlValues;
      var validation = this.validate(e.target.value, controlValues[e.target.name].validations);
      controlValues[e.target.name].pristine = false;
      controlValues[e.target.name].valid = validation.valid;
      controlValues[e.target.name].formError = validation.message;
      this.setState({
        controlValues: controlValues
      });
    }
    if (e.target.dataset["blurhandler"] == "guessMember") {
      var guess = this.guessMember(e.target.value);
      console.log("Member guess: " + guess.name);
      if (abfRentDiscountRegex.test(e.target.value)) {
        if (confirm("Is this an Abf rent discount?")) {
          window.location = "/rent_discounts/new?message=" + encodeURIComponent(e.target.value); 
        }
      }
    }
  },
  guessMember: function(str) {
    var guess = {
      id: 0,
      name: undefined,
      message: str
    };
    this.state.members.forEach(function(member){
      if (member[2] === "") return false;
      var memberId = member[0];
      var memberName = member[1];
      var regexp = new RegExp(member[2], "gi");
      if (regexp.test(str.toLowerCase())) {
        guess.id = memberId;
        guess.name = memberName;
      }
    }, this);
    return guess;
  },
  // Custom parser to extract transactions in batches.
  // NOTE: This only works for Swedish Handelsbanken files.
  // A more general parser might be implemented in the future.
  parseExcelFile: function(e){
    // File info
    var file = e.target.files[0];
    var reader = new FileReader();
    // Capture file information.
    reader.onload = (function(theFile) {
      return function(e) {
        // Arrays to hold transfers (made by members)
        var transfers = [];
        var discounts = [];
        // Keep track of when the last transaction was registered.
        var lastUpdated;
        var nrOfDiscountsAdded = 0;

        // File content
        var rawHtml = e.target.result;
        // Save all relevant cells in array
        var cells = [];
        rawHtml = rawHtml.replace(/ BGCOLOR="#[A-F0-9]*"/gi, "");
        var rows = rawHtml.split('<TR>');
        for (var i = 0; i < rows.length; i++){
          var row = rows[i];
          if(row.indexOf("<TD height") != -1){
            row = row.replace(/<[^<>]*>/gi, "#");
            var elements = row.split('#');
            for (var k = 0; k < elements.length; k++){
              var element = elements[k];
              if(/(&nbsp;|\n|^$)/.test(element) == false){
                cells.push(element);
              }
            }
          }else{
            var period = /Period: (\d{4}-\d{2}-\d{2}) till (\d{4}-\d{2}-\d{2})/.exec(row);
            if(period != null){
              lastUpdated = new Date(period[2]);
            }
          }
        }

        for (var m = 0; m < cells.length; m+=5){
          var message = cells[m + 2];
          if(abfRentDiscountRegex.test(message)){
            // 123:1234:1
            // This is a rent discount
            var discount = {
              "transferred_at": new Date(cells[m]),
              "message": message,
              "amount": parseInt(cells[m + 3].replace(" ", "")),
            };
            // if (!hashedObjectIsInArray(discount, discounts)){
              discounts.push(discount);
              nrOfDiscountsAdded++;
              console.log("RentDiscount: '" + discount.message + "', " + discount.amount);
            // }
          }else{
            // This is a rent transaction
            var memberId = this.guessMember(message).id;
            var transfer = {
              "transferred_at": new Date(cells[m]),
              "memberId": memberId,
              "message": message,
              "amount": parseInt(cells[m + 3].replace(" ", "")),
          };
            if(memberId === 0){
              console.error("Unkown transaction: " + message);
            }else{
              console.log("Member " + memberId + " transferred: " + transfer.amount);
            }
              // if(!this.ignore(message)){
              //   this.state.unknownTransaction.push(transfer);
              // }
            // }else {
            transfers.push(transfer);
            // }
          }
        }
        // console.log("Ignored " + nrOfIgnores + " transfers");
        console.log("Added " + nrOfDiscountsAdded + " discount's");
        // console.log("Subtract " + (nrOfDiscountsAdded + nrOfIgnores) + " from number of transfers");
        // this.setState({
        //   lastUpdated: lastUpdated,
        //   amountsPaid: amountsPaid,
        //   rents: rents,
        //   discounts: discounts,
        //   dataLoaded: true
        // }, function(){
        //   this.saveToBackend();
        // });

        // Add input fields with transactions for previewing
        var fields = this.state.fields;
        var controlValues = this.state.controlValues;
        var newFields = [{
          fieldType: "p",
          text: "Check that everything looks correct, edit if necessary. Click Submit when you're done."
        }];
        transfers.forEach(function(item, i){
          controlValues["transfers[" + i + "][transferred_at]"].value = item.transferred_at.toLocaleDateString();
          controlValues["transfers[" + i + "][amount]"].value = item.amount;
          controlValues["transfers[" + i + "][message]"].value = item.message;
          controlValues["transfers[" + i + "][member_id]"].value = item.memberId;

          newFields.push(
            {
              fieldType: "date",
              attribute: "transfers[" + i + "][transferred_at]",
              attributeName: "Date",
              defaultValue: item.transferred_at.toLocaleDateString(),
              unknown: item.memberId === 0
            },
            {
              fieldType: "number",
              attribute: "transfers[" + i + "][amount]",
              attributeName: "Amount",
              defaultValue: item.amount,
              unknown: item.memberId === 0
            },
            {
              fieldType: "text",
              attribute: "transfers[" + i + "][message]",
              attributeName: "Message",
              defaultValue: item.message,
              unknown: item.memberId === 0
            },
            {
              fieldType: "select",
              attribute: "transfers[" + i + "][member_id]",
              attributeName: "Who made this transaction?",
              options: this.state.members,
              defaultValue: item.memberId,
              unknown: item.memberId === 0
            },
            {
              fieldType: "divider"
            }
          );
        }, this);
        discounts.forEach(function(item, i){
          controlValues["rent_discounts[" + i + "][transferred_at]"].value = item.transferred_at.toLocaleDateString();
          controlValues["rent_discounts[" + i + "][amount]"].value = item.amount;
          controlValues["rent_discounts[" + i + "][message]"].value = item.message;

          newFields.push(
            {
              fieldType: "date",
              attribute: "rent_discounts[" + i + "][transferred_at]",
              attributeName: "Date",
              defaultValue: item.transferred_at.toLocaleDateString()
            },
            {
              fieldType: "number",
              attribute: "rent_discounts[" + i + "][amount]",
              attributeName: "Amount",
              defaultValue: item.amount
            },
            {
              fieldType: "text",
              attribute: "rent_discounts[" + i + "][message]",
              attributeName: "Message",
              defaultValue: item.message
            },
            {
              fieldType: "divider"
            }
          );
        }, this);
        newFields.push({
          fieldType: "submit",
          attributeName: "Add transfers"
        });
        this.setState({
          fields: newFields,
          controllers: {},
        }, function(){
          this.setupFields(this.state.fields);
        });
      };
    })(file).bind(this);

    // Read in the excel file as text.
    reader.readAsText(file);
  },
  render: function() {
    var fields = this.state.fields.map(function(item, i){
      if (item.isVisibleIfChecked !== undefined) {
        // This item is only rendered if `isVisibleIfChecked` is selected/checked
        var ids = item.isVisibleIfChecked.split("#");
        if (this.state.controlValues[ids[0]].value != ids[1]) {
          return null;
        }
      }
      switch(item.fieldType) {
        case "select":
        case "select_noLabel":
          return (<FormSelect
            key={i}
            valid={this.state.controlValues[item.attribute].valid}
            pristine={this.state.controlValues[item.attribute].pristine}
            formError={this.state.controlValues[item.attribute].formError}
            alignment="centered"
            autofocus={item.autofocus}
            hidden={item.hidden}
            hideLabel={item.fieldType.indexOf("_noLabel") != -1}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            controlUrl={item.controlUrl}
            fieldValue={this.state.controllers[item.attribute] !== undefined ? this.state.controllers[item.attribute].fieldValue : this.state.controlValues[item.attribute].value}
            handleChange={this.handleChange}
          />)
        break;
        case "checkbox":
          return (<FormCheckbox 
            key={i}
            valid={this.state.controlValues[item.attribute].valid}
            pristine={this.state.controlValues[item.attribute].pristine}
            formError={this.state.controlValues[item.attribute].formError}
            hidden={item.hidden}
            attribute={item.attribute}
            attributeName={item.attributeName}
            checked={this.state.controlValues[item.attribute].value}
            handleChange={this.handleChange}          
          />)
        case "radio":
          return (<FormRadio 
            key={i}
            valid={this.state.controlValues[item.attribute].valid}
            pristine={this.state.controlValues[item.attribute].pristine}
            formError={this.state.controlValues[item.attribute].formError}
            hidden={item.hidden}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            fieldValue={item.defaultValue}
            checked={this.state.controlValues[item.attribute].value == item.defaultValue}
            handleChange={this.handleChange}
          />)
        break;
        case "radios":
          console.error("Warning! fieldType: radios is deprecated. Use 'flex-items' instead.");
        //   var radios = item.btns.map(function(btn, i){
        //     return (<FormRadio 
        //     key={i}
        //     hidden={btn.hidden}
        //     attribute={btn.attribute}
        //     attributeName={btn.attributeName}
        //     options={btn.options}
        //     fieldValue={btn.defaultValue}
        //     checked={this.state.controlValues[btn.attribute] == btn.defaultValue}
        //     handleChange={this.handleChange}
        //   />)
        //   }, this)
        //   return (<div key={i} className="flex-items-container">{radios}</div>)
        break;
        case "flex-items":
          var flexItems = item.items.map(function(flexItem, i){
            var alignment = item.items.length == 1 ? "centered" : (i % 2 == 0 ? "right" : "left");
            switch (flexItem.fieldType) {
              case "radio":
                return (<FormRadio 
                key={i}
                valid={this.state.controlValues[flexItem.attribute].valid}
                pristine={this.state.controlValues[flexItem.attribute].pristine}
                formError={this.state.controlValues[flexItem.attribute].formError}
                alignment={alignment}
                hidden={flexItem.hidden}
                attribute={flexItem.attribute}
                attributeName={flexItem.attributeName}
                options={flexItem.options}
                fieldValue={flexItem.defaultValue}
                checked={this.state.controlValues[flexItem.attribute].value == flexItem.defaultValue}
                handleChange={this.handleChange}
              />)
              break;
              case "select":
                return (<FormSelect 
                  key={i}
                  valid={this.state.controlValues[flexItem.attribute].valid}
                  pristine={this.state.controlValues[flexItem.attribute].pristine}
                  formError={this.state.controlValues[flexItem.attribute].formError}
                  alignment={alignment}
                  autofocus={flexItem.autofocus}
                  hidden={flexItem.hidden}
                  hideLabel={true} //{flexItem.fieldType.indexOf("_noLabel") != -1}
                  attribute={flexItem.attribute}
                  attributeName={flexItem.attributeName}
                  options={flexItem.options}
                  controlUrl={flexItem.controlUrl}
                  fieldValue={this.state.controllers[flexItem.attribute] !== undefined ? this.state.controllers[flexItem.attribute].fieldValue : this.state.controlValues[flexItem.attribute].value}
                  handleChange={this.handleChange}
              />)
              break;
            }
          }, this)
          return (<div key={i} className="flex-items-container">{flexItems}</div>)
        break;
        case "file":
          return (<FormFileUpload
            key={i}
            valid={this.state.controlValues[item.attribute].valid}
            pristine={this.state.controlValues[item.attribute].pristine}
            formError={this.state.controlValues[item.attribute].formError}
            autofocus={item.autofocus}
            hidden={item.hidden}
            attribute={item.attribute}
            attributeName={item.attributeName}
            handleChange={this.handleChange}
          />)
        break;
        case "p":
          return (
            <div key={i} className="input-container">
              <p>{item.text}</p>
            </div>
          )
        break;
        case "h4":
          return <h4 key={i}>{item.text}</h4>
        break;
        case "a":
          return (
            <div key={i} className="input-container">
              <a href={item.href}>{item.text}</a>
            </div>
          )
        break;
        case "text_noLabel":
          return (
            <div className="input-container">
              <input key={i} formError={item.formError || []} type="text" name={item.attribute} defaultValue={this.state.controlValues[item.attribute].value} onChange={this.handleChange}/>
            </div>
          )
        break;
        case "divider":
          return <div key={i} className="line"></div>
        break;
        case "submit":
          return <FormSubmit key={i} attributeName={item.attributeName} />
        break;
        case "textarea":
          return (<FormTextarea
            key={i}
            valid={this.state.controlValues[item.attribute].valid}
            pristine={this.state.controlValues[item.attribute].pristine}
            formError={this.state.controlValues[item.attribute].formError}
            autofocus={item.autofocus}
            hidden={item.hidden}
            fieldType={item.fieldType}
            attribute={item.attribute}
            attributeName={item.attributeName}
            placeholder=""
            handleChange={this.handleChange}      
            value={this.state.controlValues[item.attribute].value}      
            defaultValue={this.state.controlValues[item.attribute].value}
          />)
        break;
        default:
          return (<FormField
            key={i}
            valid={this.state.controlValues[item.attribute].valid}
            pristine={this.state.controlValues[item.attribute].pristine}
            formError={this.state.controlValues[item.attribute].formError}
            autofocus={item.autofocus}
            hidden={item.hidden}
            fieldType={item.fieldType}
            attribute={item.attribute}
            attributeName={item.attributeName}
            placeholder=""
            handleChange={this.handleChange}      
            handleBlur={this.handleBlur}
            dataBlurHandler={item.handleBlur}
            value={this.state.controlValues[item.attribute].value}      
            defaultValue={this.state.controlValues[item.attribute].value}
          />)
        break;
      }
    }, this)
    return (
      <form className="full-width" acceptCharset="UTF-8" action={this.props.action} method="post" onSubmit={this.validateForm}>
        <input type="hidden" name="authenticity_token" defaultValue={this.props.authenticity_token} />
        {this.props.method == "patch" ? <input name="_method" value="patch" type="hidden" /> : null}
        <h3>{this.props.title}</h3>
        {this.props.formErrorHeading != null ? <div className="alert alert-danger">{this.props.formErrorHeading}</div> : null}
        {fields}
      </form>
    )
  }

});

var FormField = React.createClass({
  render: function() {
    var idName = idEncode(this.props.attribute);
    return (
      <div className={this.props.hidden ? "hidden" : "input-container" }>
        <input
          autoFocus={this.props.autofocus}
          type={this.props.fieldType}
          onChange={this.props.handleChange}
          name={this.props.attribute}
          id={idName}
          value={this.props.value}
          onChange={this.props.handleChange}
          onBlur={this.props.handleBlur}
          data-blurhandler={this.props.dataBlurHandler}
          placeholder={this.props.placeholder}
          required={this.props.hidden == true}
        />
        <label htmlFor={idName}>{this.props.attributeName}</label>
        {this.props.pristine || this.props.valid ? null : <div className="formError">{this.props.formError}</div>}
      </div>
    )
  }
});

var FormTextarea = React.createClass({
  render: function() {
    var idName = idEncode(this.props.attribute);
    return (
      <div className={this.props.hidden ? "hidden" : "input-container" }>
        <p>{this.props.attributeName}</p>
        <textarea
          autoFocus={this.props.autofocus}
          type={this.props.fieldType}
          onChange={this.props.handleChange}
          name={this.props.attribute}
          id={idName}
          value={this.props.value}
          onChange={this.props.handleChange}
          placeholder={this.props.placeholder}
          required={this.props.hidden == true}
        />
        {this.props.pristine || this.props.valid ? null : <div className="formError">{this.props.formError}</div>}
      </div>
    )
  }
});

var FormSelect = React.createClass({
  render: function() {
    var idName = idEncode(this.props.attribute);
    var options = this.props.options.map(function(option, i){
      return <option key={i} value={option[0]}>{option[1]}</option>
    });
    return (
      options.length > 0 ?
      <div 
        className={(this.props.hidden ? "hidden" : "input-container" ) + (this.props.hideLabel ? " flex-item" : "") + " " + this.props.alignment}
        style={this.props.hideLabel ? {display: "inline"} : null}>
        {this.props.hideLabel ? null : <label htmlFor={idName}>{this.props.attributeName}</label>}
        <select
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={idName}
          data-controlurl={this.props.controlUrl}
          onChange={this.props.handleChange}>
            {options}
        </select>
        {this.props.pristine || this.props.valid ? null : <div className="formError">{this.props.formError}</div>}
      </div>
      : null
    )
  }
});

var FormRadio = React.createClass({
  render: function() {
    return (
      <span className="flex-item">
        <input
          type="radio"
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute + "_" + this.props.fieldValue}
          checked={this.props.checked}
          onChange={this.props.handleChange}
        />
      <label htmlFor={this.props.attribute + "_" + this.props.fieldValue}>{this.props.attributeName}</label>
      </span>
    )
  }
});

var FormCheckbox = React.createClass({
  render: function() {
    return (
      <div className={this.props.hidden ? "hidden" : "input-container" }>
        <input
          type="checkbox"
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute}
          checked={this.props.checked}
          onChange={this.props.handleChange}
        />
        <label htmlFor={this.props.attribute}><Svg />{this.props.attributeName}</label>
        {this.props.pristine || this.props.valid ? null : <div className="formError">{this.props.formError}</div>}
      </div>
    )
  }
});

var FormFileUpload = React.createClass({
  render: function() {
    return (
      <div className={this.props.hidden ? "hidden" : "input-container centered" }>
        <input
          type="file"
          name={this.props.attribute}
          id={this.props.attribute}
          onChange={this.props.handleChange}
        />
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        {this.props.pristine || this.props.valid ? null : <div className="formError">{this.props.formError}</div>}
      </div>
    )
  }  
});

var FormSubmit = React.createClass({
  render: function() {
    return (
      <div className={this.props.hidden ? "hidden" : "input-container" }>
        <input
          type="submit"
          name="commit"
          className="btn-primary"
          value={this.props.attributeName}
        />
      </div>
    )
  }
})

var Svg = React.createClass({
  render: function() {
    return (
      <svg
        className="icon"
        version="1.1" id="checkbox_yes"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 100 100"
        style={{enableBackground:"new 0 0 100 100"}}
        xmlSpace="preserve"
      >
        <polyline
          points="29.5,49.704 47.296,67.5 77,37.796"
          className="drawable drawable-stroke svg-stroke stroke-on-checked"
          style={{strokeDasharray: 105, strokeDashoffset: 105 }}
        />
        <circle
          id="stroke-circle"
          cx="0"
          cy="0"
          r="46.5"
          className="drawable stroke-on-hover"
          style={{strokeDasharray: 290, strokeDashoffset: 290, stroke: "#FFF", fill: "none", strokeWidth: "6", opacity: "0.5" }}
        />
        <circle
          cx="50"
          cy="50"
          r="46.5"
          className="drawable show-on-checked"
          style={{stroke: "#FFF", fill: "none", strokeWidth: "6", opacity: "0" }}
        />
        <circle
          cx="50"
          cy="50"
          r="46.5"
          style={{fill: "#FFF", opacity: "0.1" }}
        />
      </svg>
    )
  }
})