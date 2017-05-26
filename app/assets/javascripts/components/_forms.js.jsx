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
        case "email":
        case "password":
        case "number":
        case "date":
        case "hidden":
        case "checkbox":
        case "file":
          controlValues[item.attribute] = item.defaultValue !== undefined ? item.defaultValue : "";
        break;
        case "radio":
          controlValues[item.attribute] = item.checked ? item.defaultValue : "";
        break;
        case "flex-items":
          item.items.forEach(function(flexItem) {
            switch (flexItem.fieldType) {
              case "radio":
                controlValues[flexItem.attribute] = flexItem.checked ? flexItem.defaultValue : "";
              break;
              case "select":
                controlValues[flexItem.attribute] = flexItem.defaultValue;
              break;
            }
          });
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
        var url = this.generateUrl(e.target.dataset.controlurl, e.target.value);
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
    // return ({
    //   id: 1,
    //   name: "ADMIN Member",
    //   message: str
    // });
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
//        console.log("/" + member[2] + "/gi matches " + str);
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
          controlValues["transfers[" + i + "][transferred_at]"] = item.transferred_at.toLocaleDateString();
          controlValues["transfers[" + i + "][amount]"] = item.amount;
          controlValues["transfers[" + i + "][message]"] = item.message;
          controlValues["transfers[" + i + "][member_id]"] = item.memberId;

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
          controlValues["rent_discounts[" + i + "][transferred_at]"] = item.transferred_at.toLocaleDateString();
          controlValues["rent_discounts[" + i + "][amount]"] = item.amount;
          controlValues["rent_discounts[" + i + "][message]"] = item.message;

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
        if (this.state.controlValues[ids[0]] != ids[1]) {
          return null;
        }
      }
      switch(item.fieldType) {
        case "select":
        case "select_noLabel":
          return (<FormSelect
            key={i}
            alignment="centered"
            autofocus={item.autofocus}
            hidden={item.hidden}
            hideLabel={item.fieldType.indexOf("_noLabel") != -1}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            controlUrl={item.controlUrl}
            fieldValue={this.state.controllers[item.attribute] !== undefined ? this.state.controllers[item.attribute].fieldValue : this.state.controlValues[item.attribute]}
            handleSelect={this.handleSelect}
          />)
        break;
        case "checkbox":
          return (<FormCheckbox 
            key={i}
            hidden={item.hidden}
            attribute={item.attribute}
            attributeName={item.attributeName}
            checked={this.state.controlValues[item.attribute]}
            handleSelect={this.handleSelect}          
          />)
        case "radio":
          return (<FormRadio 
            key={i}
            hidden={item.hidden}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            fieldValue={item.defaultValue}
            checked={this.state.controlValues[item.attribute] == item.defaultValue}
            handleSelect={this.handleSelect}
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
        //     handleSelect={this.handleSelect}
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
                alignment={alignment}
                hidden={flexItem.hidden}
                attribute={flexItem.attribute}
                attributeName={flexItem.attributeName}
                options={flexItem.options}
                fieldValue={flexItem.defaultValue}
                checked={this.state.controlValues[flexItem.attribute] == flexItem.defaultValue}
                handleSelect={this.handleSelect}
              />)
              break;
              case "select":
                return (<FormSelect 
                  key={i}
                  alignment={alignment}
                  autofocus={flexItem.autofocus}
                  hidden={flexItem.hidden}
                  hideLabel={true} //{flexItem.fieldType.indexOf("_noLabel") != -1}
                  attribute={flexItem.attribute}
                  attributeName={flexItem.attributeName}
                  options={flexItem.options}
                  controlUrl={flexItem.controlUrl}
                  fieldValue={this.state.controllers[flexItem.attribute] !== undefined ? this.state.controllers[flexItem.attribute].fieldValue : this.state.controlValues[flexItem.attribute]}
                  handleSelect={this.handleSelect}
              />)
              break;
            }
          }, this)
          return (<div key={i} className="flex-items-container">{flexItems}</div>)
        break;
        case "file":
          return (<FormFileUpload
            key={i}
            autofocus={item.autofocus}
            hidden={item.hidden}
            attribute={item.attribute}
            attributeName={item.attributeName}
            handleSelect={this.handleSelect}
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
        case "text_noLabel":
          return (
            <div className="input-container">
              <input key={i} type="text" name={item.attribute} defaultValue={this.state.controlValues[item.attribute]} onChange={this.handleSelect}/>
            </div>
          )
        break;
        case "divider":
          return <div key={i} className="line"></div>
        break;
        case "submit":
          return <FormSubmit key={i} attributeName={item.attributeName} />
        break;
        default:
          return (<FormField
            key={i}
            autofocus={item.autofocus}
            hidden={item.hidden}
            fieldType={item.fieldType}
            attribute={item.attribute}
            attributeName={item.attributeName}
            placeholder=""
            handleSelect={this.handleSelect}      
            value={this.state.controlValues[item.attribute]}      
            defaultValue={this.state.controlValues[item.attribute]}
          />)
        break;
      }
    }, this)
    var flash = this.props.flash !== undefined ? this.props.flash.map(function(error, i) {
      return <span key={i} className={"alert alert-" + error[0]}>{error[1]}</span>
    }) : null;
    return (
      <form className="full-width" acceptCharset="UTF-8" action={this.props.action} method="post">
        <input type="hidden" name="authenticity_token" defaultValue={this.props.authenticity_token} />
        {this.props.method == "patch" ? <input name="_method" value="patch" type="hidden" /> : null}
        <h3>{this.props.title}</h3>
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
      <div className={this.props.hidden ? "hidden" : "input-container" }>
        <input
          autoFocus={this.props.autofocus}
          type={this.props.fieldType}
          onChange={this.props.handleSelect}
          name={this.props.attribute}
          id={idName}
          value={this.props.value}
          onChange={this.props.handleSelect}
          placeholder={this.props.placeholder}
          required={this.props.hidden == true}
        />
        <label htmlFor={idName}>{this.props.attributeName}</label>
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
      <div 
        className={(this.props.hidden ? "hidden" : "input-container" ) + (this.props.hideLabel ? " flex-item" : "") + " " + this.props.alignment}
        style={this.props.hideLabel ? {display: "inline"} : null}>
        {this.props.hideLabel ? null : <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>}
        <select
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute}
          data-controlurl={this.props.controlUrl}
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
      <span className="flex-item">
        <input
          type="radio"
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute + "_" + this.props.fieldValue}
          checked={this.props.checked}
          onChange={this.props.handleSelect}
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
          onChange={this.props.handleSelect}
        />
        <label htmlFor={this.props.attribute}><Svg />{this.props.attributeName}</label>
      </div>
    )
  }
});

var FormFileUpload = React.createClass({
  render: function() {
    return (
      <div className={this.props.hidden ? "hidden" : "input-container" }>
        <input
          type="file"
          name={this.props.attribute}
          id={this.props.attribute}
          onChange={this.props.handleSelect}
        />
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
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