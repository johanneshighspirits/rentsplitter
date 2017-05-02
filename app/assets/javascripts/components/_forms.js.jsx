var Form = React.createClass({
  getInitialState: function(){
    return ({
      controlleds: {
        member_id: 0,
        project_id: 0
      },
      fields: this.props.fields,
      showSubmit: false
    });
  },
  handleSelect: function(e) {
    switch (e.target.id) {
      case "member_id":
        $.get('/members/' + e.target.value + '/projects.json', function(projects){
          var fields = this.state.fields.map(function(item, i){
            if (item.attribute == "project_id") {
              item.options = projects;
            }
            return item;
          });
          this.setState({
            fields: fields,
            showSubmit: true
          });
        }.bind(this), 'json');
      break;
      default:
        console.log("Ignore " + e.target.id);
      break;
    }

  },
  render: function() {
    var fields = this.state.fields.map(function(item, i){
      switch(item.fieldType) {
        case "select":
          return (<FormSelect
            key={i}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            controlleds={this.state.controlleds[item.attribute]}
            handleSelect={this.handleSelect}
          />)
        break;
        case "submit":
          return (this.state.showSubmit ?
          <FormField
            key={i}
            fieldType={item.fieldType}
            attribute={item.attribute}
            attributeName={item.attributeName}
            defaultValue={item.defaultValue}
          /> : null)
        break;
        default:
          return (<FormField
            key={i}
            fieldType={item.fieldType}
            attribute={item.attribute}
            attributeName={item.attributeName}
            defaultValue={item.defaultValue}
          />)
        break;
      }
    }, this)
    return (
      <form acceptCharset="UTF-8" action={this.props.action} method="post">
        <input type="hidden" name="authenticity_token" defaultValue={this.props.authenticity_token} />
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
        <input type={this.props.fieldType} name={this.props.attribute} id={idName} defaultValue={this.props.defaultValue} />
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
      <div>
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        <select
          value={this.props.controlleds[this.props.attribute]}
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

/*

<form class="new_transfer" id="new_transfer" action="/transfers" accept-charset="UTF-8" method="post"><input name="utf8" type="hidden" value="✓"><input type="hidden" name="authenticity_token" value="0cdjJ8W70qDszIFQLaicB0gZUtUf1DR+MvSqkxvtgfPJFKgkatItHG8PK97obvC4pZiIkK2543Wr9K1zvI04KQ==">
  <label for="transfer_transferred_at">Date</label>
  <input value="2017-05-02" type="text" name="transfer[transferred_at]" id="transfer_transferred_at">

  <label for="transfer_message">Message</label>
  <input type="text" name="transfer[message]" id="transfer_message">

  <label for="transfer_amount">Amount</label>
  <input type="number" name="transfer[amount]" id="transfer_amount">

  <label for="transfer_member_id">Paid by Member</label>
  <select name="member_id" id="member_id"><option value="1">ADMIN Member</option>
<option value="2">Member 0</option>
<option value="3">Member 1</option>
<option value="4">Member 2</option>
<option value="5">Member 3</option>
<option value="6">Member 4</option></select>

  <label for="transfer_project_id">Project</label>
  <select name="project_id" id="project_id"><option value="1">Project Nr ONE</option>
<option value="2">Project 0</option>
<option value="3">Project 1</option>
<option value="4">Project 2</option>
<option value="5">Project 3</option>
<option value="6">Project 4</option></select>  

  <input type="submit" name="commit" value="Add transfer" disable_with="Adding transfer..." data-disable-with="Add transfer">

</form>

*/