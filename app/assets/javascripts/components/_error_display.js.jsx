var ErrorDisplay = React.createClass({
  render: function() {
    if (this.props.errors === undefined) { return null }
    var errors = this.props.errors.map(function(error, i) {
      if (Array.isArray(this.props.errors)) {
        return <li className="alert alert-danger" key={i}>{error}</li>
      }else{
        return <li className={"alert alert-" + error[0]} key={i}>{error[1]}</li>
      }
    }, this);
    return (<div><ul>{errors}</ul></div>);
  }
})