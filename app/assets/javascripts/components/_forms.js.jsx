var Form = React.createClass({
  getInitialState: function(){
    var controllers = {};
    var controlValues = {};
    this.props.fields.forEach(function(item){
      // Add value to controlValues
      switch (item.fieldType) {
        case "select":
        case "select_noLabel":
        case "text":
        case "email":
        case "password":
        case "number":
        case "date":
        case "hidden":
        case "checkbox":
        case "file":
          controlValues[item.attribute] = item.defaultValue;
        break;
        case "radio":
          controlValues[item.attribute] = "";
        break;
        default:
          console.warn("Ignored: " + item.attribute + ", of type " + item.fieldType);
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
    });
    return ({
      members: this.props.members,
      controllers: controllers,
      controlValues: controlValues,
      fields: this.props.fields
    });
  },
  pluralize: function(str) {
    return str.replace("_id", "s");
  },
  handleSelect: function(e) {
    if (this.state.controlValues[e.target.name] !== undefined) {
      var controlValues = this.state.controlValues;
      switch (e.target.type) {
        case "checkbox":
          controlValues[e.target.name] = !controlValues[e.target.name];
        break;
        case "file":
          controlValues[e.target.name] = e.target.value;
          this.parseExcelFile(e);
        break;
        default:
          controlValues[e.target.name] = e.target.value;
        break;
      }
      this.setState({
        controlValues: controlValues
      });      
    }

    if (this.state.controllers[e.target.name] !== undefined) {

      var controller = this.state.controllers[e.target.name];
      switch (controller[0].controlType) {
        case "select":
        // This Select is controlling another one, meaning that when
        // this value changes, the other value should change too.
        var url = "/" + this.pluralize(e.target.name) + "/" + e.target.value + "/" + this.pluralize(controller[0].targetId) + ".json";
        $.get(url, function(results){
          var fields = this.state.fields.map(function(item, i){
            if (item.attribute == controller[0].targetId) {
              item.options = results;
            }
            return item;
          });
          this.setState({
            fields: fields
          });
        }.bind(this), 'json');
        break;
      }
    }
  },
  guessMember: function(str) {
    return ({
      id: 1,
      name: "ADMIN Member",
      message: str
    });
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
        console.log("/" + member[2] + "/gi matches " + str);
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
          if(/\d{3}:\d{4}:\d/gi.test(message)){
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
              console.log("TODO: Catch this unkown transaction: " + message);
              // if(!this.ignore(message)){
              //   this.state.unknownTransaction.push(transfer);
              // }
            }else {
              transfers.push(transfer);
              console.log("Member " + memberId + " transferred: " + transfer.amount);
            }
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
        console.log(transfers);
        var newFields = [{
          fieldType: "p",
          text: "Check that everything looks correct, edit if necessary. Click Submit when you're done."
        }];
        transfers.forEach(function(item, i){
          controlValues["transfers[" + i + "][transferred_at]"] = item.transferred_at.toLocaleDateString();
          controlValues["transfers[" + i + "][amount]"] = item.amount;
          controlValues["transfers[" + i + "][message]"] = item.message;
          controlValues["transfers[" + i + "][member_id]"] = item.memberId;

          newFields.push(
          {
            fieldType: "p",
            text: "Transfer " + (i + 1) + " (" + item.message + ")"
          },
          {
            fieldType: "text_noLabel",
            attribute: "transfers[" + i + "][transferred_at]",
            attributeName: item.transferred_at.toLocaleDateString(),
            // defaultValue: item.transferred_at.toLocaleDateString()
          },
          {
            fieldType: "text_noLabel",
            attribute: "transfers[" + i + "][amount]",
            attributeName: item.amount,
            // defaultValue: item.amount
          },
          {
            fieldType: "text_noLabel",
            attribute: "transfers[" + i + "][message]",
            attributeName: item.message,
            // defaultValue: item.message
          },
          {
            fieldType: "select_noLabel",
            attribute: "transfers[" + i + "][member_id]",
            attributeName: item.memberId,
            options: this.state.members,
            defaultValue: item.memberId
          }
          );
        }, this);
        discounts.forEach(function(item, i){
          controlValues["rent_discounts[" + i + "][transferred_at]"] = item.transferred_at.toLocaleDateString();
          controlValues["rent_discounts[" + i + "][amount]"] = item.amount;
          controlValues["rent_discounts[" + i + "][message]"] = item.message;

          newFields.push(
          {
            fieldType: "p",
            text: "Rent Discount " + (i + 1) + " (" + item.message + ")"
          },
          {
            fieldType: "text_noLabel",
            attribute: "rent_discounts[" + i + "][transferred_at]",
            attributeName: item.transferred_at.toLocaleDateString(),
            // defaultValue: item.transferred_at.toLocaleDateString()
          },
          {
            fieldType: "text_noLabel",
            attribute: "rent_discounts[" + i + "][amount]",
            attributeName: item.amount,
            // defaultValue: item.amount
          },
          {
            fieldType: "text_noLabel",
            attribute: "rent_discounts[" + i + "][message]",
            attributeName: item.message,
            // defaultValue: item.message
          }
          );
        }, this);
        newFields.push({
          fieldType: "submit",
          attributeName: "Add transfers"
        });
        this.setState({
          fields: newFields
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
        if (this.state.controlValues[ids[0]] != ids[1]) {
          return null;
        }
      }
      switch(item.fieldType) {
        case "select":
        case "select_noLabel":
          return (<FormSelect
            key={i}
            hideLabel={item.fieldType.indexOf("_noLabel") != -1}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            fieldValue={this.state.controllers[item.attribute] !== undefined ? this.state.controllers[item.attribute].fieldValue : this.state.controlValues[item.attribute]}
            handleSelect={this.handleSelect}
          />)
        break;
        case "checkbox":
          return (<FormCheckbox 
            key={i}
            attribute={item.attribute}
            attributeName={item.attributeName}
            checked={this.state.controlValues[item.attribute]}
            handleSelect={this.handleSelect}          
          />)
        case "radio":
          return (<FormRadio 
            key={i}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            fieldValue={item.defaultValue}
            checked={this.state.controlValues[item.attribute] == item.defaultValue}
            handleSelect={this.handleSelect}
          />)
        break;
        case "file":
          return (<FormFileUpload
            key={i}
            attribute={item.attribute}
            attributeName={item.attributeName}
            handleSelect={this.handleSelect}
          />)
        break;
        case "p":
          return <p key={i}>{item.text}</p>
        break;
        case "text_noLabel":
          return <input key={i} type="text" name={item.attribute} defaultValue={this.state.controlValues[item.attribute]} onChange={this.handleSelect}/>
        break;
        case "submit":
          return <FormSubmit key={i} attributeName={item.attributeName} />
        break;
        default:
          return (<FormField
            key={i}
            fieldType={item.fieldType}
            attribute={item.attribute}
            attributeName={item.attributeName}
            handleSelect={this.handleSelect}            
            defaultValue={this.state.controlValues[item.attribute]}
          />)
        break;
      }
    }, this)
    var flash = this.props.flash !== undefined ? this.props.flash.map(function(error, i) {
      return <span key={i} className={"alert alert-" + error[0]}>{error[1]}</span>
    }) : null;
    return (
      <form acceptCharset="UTF-8" action={this.props.action} method="post">
        <input type="hidden" name="authenticity_token" defaultValue={this.props.authenticity_token} />
        {flash}
        {fields}
      </form>
    )
  }

});

var FormField = React.createClass({
  render: function() {
    var idName = this.props.attribute.replace("[", "_").replace("]", "");
    return (
      <div>
        <label htmlFor={idName}>{this.props.attributeName}</label>
        <input
          type={this.props.fieldType}
          onChange={this.props.handleSelect}
          name={this.props.attribute}
          id={idName}
          defaultValue={this.props.defaultValue}
        />
      </div>
    )
  }
});

var FormSelect = React.createClass({
  render: function() {
    var options = this.props.options.map(function(option, i){
      return <option key={i} value={option[0]}>{option[1]}</option>
    });
    return (
      options.length > 0 ?
      <div style={this.props.hideLabel ? {display: "inline"} : null}>
        {this.props.hideLabel ? null : <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>}
        <select
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute}
          onChange={this.props.handleSelect}>
            {options}
        </select>
      </div>
      : null
    )
  }
});

var FormRadio = React.createClass({
  render: function() {
    return (
      <div>
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        <input
          type="radio"
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute + "_" + this.props.fieldValue}
          checked={this.props.checked}
          onChange={this.props.handleSelect}
        />
      </div>
    )
  }
});

var FormCheckbox = React.createClass({
  render: function() {
    return (
      <div>
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        <input
          type="checkbox"
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute}
          checked={this.props.checked}
          onChange={this.props.handleSelect}
        />
      </div>
    )
  }
});

var FormFileUpload = React.createClass({
  render: function() {
    return (
      <div>
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        <input
          type="file"
          name={this.props.attribute}
          id={this.props.attribute}
          onChange={this.props.handleSelect}
        />
      </div>
    )
  }  
});

var FormSubmit = React.createClass({
  render: function() {
    return (
      <div>
        <input
          type="submit"
          name="commit"
          value={this.props.attributeName}
        />
      </div>
    )
  }
})