# RentSplitter

### Problem:
A group of musicians (called `members`) shares a rehearsing room with a monthly rent (`rent`), paid in advance. The number of members can change every month. To complicate things, a monthly financial support (`support`) gets paid out the month after. The amount of this financial support varies each month.

---
__Example:__
The rent is __10.000__
There are __10 members__
All members join the rehearsing room on __Jan 1st 2017__.
As the rent is _paid in advance_, all the member has to pay __10.000 / 10 = 1.000__ the 31st of Dec 2016.

One month goes by and everybody pays rent for February. Since all the members decide to stay, the amount is once again __1.000__ per member.

So far, so good. Now, here comes the tricky bit.

Sometime in February, a financial support of __3.000__ is paid out. Instead of paying each member __300__ right away, the rent will be adjusted at the end of the month. So, for the March rent, every member only has to pay __(10.000 - 3.000) / 10 = 700__.

Okay, I admit it's still manageable.

Now, __member A__ _didn't pay_ last month so the amount is now __1.700__ 
__Member B__ decides to leave the room and will have to pay for one extra month as the period of notice is one month.
__Member C__ misreads the email and only paid __500__

In March, two financial supports are paid out, __2.000__ and __1.500__.

_How much should each member pay on the 31st of March?_

---

## Mission:
* Calculate how much each member should pay.
* Keep track of who has paid and who has not.
* Account for the financial support(s).
* Send an email to every member in the end of the month, stating the calculated rent to pay.

### Additional details:
* Display all the transactions in a web app that all active members have access to.
* Use invites to add members.
* Use `Ruby on rails` as backend
* Use `react-js` as frontend

---

## Setup
Clone repo, then install the needed gems
```
$ bundle install --without production
```
Setup database
```
$ rails db:migrate
```
Start a test server
```
$ rails server
```
You'll now be able to preview the app in a browser at `http://localhost:3000`

