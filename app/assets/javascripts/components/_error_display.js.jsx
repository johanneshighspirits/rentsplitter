var ErrorDisplay = React.createClass({
  render: function() {
    return <div></div>
    var errors = this.props.errors.map(function(error, i) {
      if (!Array.isArray(error)) {
        return <li className="alert alert-danger" key={i}>{error}</li>
      }else{
        if (!Array.isArray(error[1])) {
          return <li className={"alert alert-" + error[0]} key={i}>{error[1]}</li>
        }else{
          var errorLines = [];
          error[1].forEach(function(errorLine, x) {
            errorLines.push(<li className={"alert alert-" + error[0]} key={x}>{errorLine}</li>);
          });
          return errorLines;
        }
      }
    }, this);
    return (<div><ul>{errors}</ul></div>);
  }
})