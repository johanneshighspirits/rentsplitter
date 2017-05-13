
// Address namespace issue
window.RentSplitter = React.createClass({
  getInitialState: function(){
    return ({
      rents: [],
      rentDiscounts: [],
      members: []
    });
  },
  componentDidMount: function() {
    $.get('/projects/' + this.props.project.id + '/transfers.json', function(projectInfo){
      this.setState({
        rents: projectInfo.rentAndDiscounts.rents,
        rentDiscounts: projectInfo.rentAndDiscounts.discounts,
        members: projectInfo.memberTransfers
      });
    }.bind(this), 'json');
  },
  render: function() {
    var today = new Date();
    var thisMonth = today.getMonthName();
    var members = this.state.members.map(function(member, m) {
      return (
        <MemberInfo
          key={m}
          member={member}
          thisMonth={thisMonth}
          rents={this.state.rents}
          rentDiscounts={this.state.rentDiscounts}
        />
      )
    }, this);
    return (
      <section className="centered">
        <article>
          <h2>{this.props.project.name}<i>&mdash; react-js</i></h2>
          <p>main info here</p>
        </article>
        <article>
          <ul>
            {members}
          </ul>
        </article>
      </section>
    )
  }
});

function easeInQuad(t, b, c, d) {
  return c * (t /= d) * t + b;
}

function counter(element, startNr, endNr) {
  var time = 0;
  var diff = endNr;
  var minTime = 0;
  var maxTime = 1500;

  for (var i = 0; i <= endNr; i++) {
    (function(s) {
      setTimeout(function() {
        element.innerHTML = s + ":-";
      }, time);
    })(i);

    time = easeInQuad(i, minTime, maxTime, diff);
  }
}

var MemberInfo = React.createClass({
  componentDidMount: function() {
    var counters = [].slice.call(ReactDOM.findDOMNode(this).getElementsByClassName('counter'));
    counters.forEach(function(element) {
      counter(element, 0, element.dataset['amount']);
    });
  },
  render: function() {
    var isMember = this.props.member.isMember;
    // The total amount to pay
    // ((rent - support) / nr of members)
    // var amountToPay = this.props.totalRentToPay;
    // var transfers = this.props.member.transfers.map(function(transfer, t){
    //   if (transfer.amount == null) {
    //     console.warn("WARNING: Amount is NULL: ", transfer);
    //     transfer.amount = 0;
    //   }
    //   amountToPay -= parseInt(transfer.amount);
    //   return (
    //     <tr key={t} className={transfer.isNotViewedYet ? "newTransaction" : null}>
    //       <td width="33%" className="lined shortDate">{transfer.shortDate}</td>
    //       <td width="33%" className="lined longDate">{transfer.longDate}</td>
    //       <td width="50%" className="lined"><i>{transfer.message}</i></td>
    //       <td width="17%" className="lined right">{transfer.amount}:-</td>
    //     </tr>
    //   )
    // });

    /* transactionHistory is a list of all transactions that concerns this member.
    It is sorted on dates. */
    var transactionHistory = [];
    var totalAmountToPay = 0;
    // Add rent amount to be paid.
    this.props.rents.forEach(function(rent, i) {
      if (rent.from >= this.props.member.joinedAt && rent.to <= this.props.member.leftAt) {
        // Member had membership when this rent is due
        totalAmountToPay += parseInt(rent.sharedAmount || 0);
        transactionHistory.push(
          <Transaction
            key={"rent" + i}
            type="rent"
            date={Date.parse(rent.longDate)}
            transaction={rent}
          />
        )
      }
    }, this);
    // Add rentDiscounts (a discount is transferred the month after, so discounts
    // added in March should be applied to member rent if member was participating
    // in Feburary)
    this.props.rentDiscounts.forEach(function(discount, i) {
      if (discount.from >= this.props.member.joinedAt && discount.to <= this.props.member.leftAt) {
        totalAmountToPay -= parseInt(discount.sharedAmount || 0);
        transactionHistory.push(
          <Transaction
            key={"discount" + i}
            type="discount"
            date={Date.parse(discount.longDate)}
            transaction={discount}
          />
        )
      }else{
        console.log("Ignored discount " + discount.from + "-" + discount.to + " since member joined " + this.props.member.joinedAt);
      }
    }, this);
    // Add transfers (every payment this member has ever made)

    // Sort transactionHistory on dates.
    transactionHistory.sort(function(a,b){a<b})
    return (
      <div className={isMember ? "memberInfo noLongerMember" : "memberInfo"}>
        <h3>{this.props.member.name}</h3>
        {!isMember ? <p className="noLongerMember">{this.props.member.name} är inte medlem i<br/>Årsta Frukt & Musik AB längre.<br/>{totalAmountToPay > 0 ? "KVARSTÅENDE SKULD: " + (totalAmountToPay * -1) + ":-" : "Alla skulder betalda."}</p> : null }
        {totalAmountToPay > 0 ?
        <span className="red" style={{background: "#d05959", color: "#FFF"}}>Att betala senast sista {this.props.thisMonth}:
          <span className="displayNumbers right counter" data-amount={totalAmountToPay}>{totalAmountToPay}:-</span>
        </span>
          :
        <span className="green" style={{background: "#499260", color: "#FFF"}}>Till godo:
          <span className="displayNumbers right counter" data-amount={totalAmountToPay * -1}>{totalAmountToPay * -1}:-</span>
        </span>
        }
        <table>
          <thead>
            <tr>
              <th colSpan="3" style={{paddingBottom: "0.7em", fontSize: "1.2em"}}>Tidigare inbetalningar</th>
            </tr>
            <tr>
              <th>Datum</th>
              <th>Meddelande</th>
              <th>Belopp</th>
            </tr>
          </thead>
          <tbody>
            {/* transfers */}
            {transactionHistory}
          </tbody>
        </table>
      </div>
    )
  }
});

var Transaction = React.createClass({
  render: function() {
    return (
      <tr className={this.props.transaction.isNotViewedYet ? this.props.type + " newTransaction" : this.props.type}>
        <td width="33%" className="lined shortDate">{this.props.transaction.shortDate}</td>
        <td width="33%" className="lined longDate">{this.props.transaction.longDate}</td>
        <td width="50%" className="lined"><i>{this.props.transaction.message}</i></td>
        <td width="17%" className="lined right">{this.props.transaction.sharedAmount || this.props.transaction.amount}:-</td>
      </tr>
    )
  }
})

var ExcelParser = React.createClass({
    parseExcelFile: function(e){
    var file = e.target.files[0];
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
        // Array to hold transactions
        var transactions = [];
//        var displayDates = {};
        var lastUpdated;
        var rents = this.state.rents;

        var rawHtml = e.target.result;
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
                transactions.push(element);
              }
            }
          }else{
            var period = /Period: (\d{4}-\d{2}-\d{2}) till (\d{4}-\d{2}-\d{2})/.exec(row);
            if(period != null){
              lastUpdated = new Date(period[2]);
              // displayDates = {
              //   from: new Date(period[1]),
              //   to: new Date(period[2]),
              // }
              // for (var month = displayDates.from.getMonth(); month <= displayDates.to.getMonth(); month++) {
              //   var d = new Date();
              //   d.setFullYear(2016, (month + 1), 0);
              //   rents.push({
              //     due: d,
              //     amount: 9000,
              //   });
              // }
            }
          }
        }

        var abfs = this.state.abfs;
        var amountsPaid = this.state.amountsPaid;
        for (var m = 0; m < transactions.length; m+=5){
          var message = transactions[m + 2];
          if(/\d{3}:\d{4}:\d/gi.test(message)){
            // 123:1234:1 tyu
            // This is a abf bidrag
            var md5 = this.md5(transactions[m] + message);
            var abf = {
              "date": new Date(transactions[m]),
              "name": "ABF-bidrag",
              "message": message,
              "amount": parseInt(transactions[m + 3].replace(" ", "")),
              "md5": md5
            };
            if (!hashedObjectIsInArray(abf, abfs)){
              abfs.push(abf);
              nrOfAbfsAdded++;
              console.log("ABF: " + abf.amount);
            }
          }else{
            // This is a rent transaction
            var name = this.guessPayer(message).name;
            var md5 = this.md5(transactions[m] + name + message + transactions[m + 3]);
            var amountPaid = {
              "date": new Date(transactions[m]),
              "paidBy": name,
              "message": message,
              "amount": parseInt(transactions[m + 3].replace(" ", "")),
              "md5": md5
          };
            if(name == "UNKNOWN"){
              if(!this.ignore(message)){
                this.state.unknownTransactions.push(amountPaid);
              }
            }else if(!hashedObjectIsInArray(amountPaid, amountsPaid)){
              amountsPaid.push(amountPaid);
              console.log(name + ": " + amountPaid.amount);
            }
          }
        }
        console.log(rents);
        console.log("Ignored " + nrOfIgnores + " transactions");
        console.log("Added " + nrOfAbfsAdded + " abf's");
        console.log("Subtract " + (nrOfAbfsAdded + nrOfIgnores) + " from number of transactions");
        this.setState({
//          displayDates: displayDates,
          lastUpdated: lastUpdated,
          amountsPaid: amountsPaid,
          rents: rents,
          abfs: abfs,
          dataLoaded: true
        }, function(){
          this.saveToBackend();
        });
      };
    })(file).bind(this);

    // Read in the excel file as text.
    reader.readAsText(file);
  },
  render: function() {
    return <div>ExcelParser</div>
  }
})
