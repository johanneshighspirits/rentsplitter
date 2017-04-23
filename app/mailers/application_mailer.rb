class ApplicationMailer < ActionMailer::Base
  default from: 'noreply@rentsplitter.herokuapp.com'
  layout 'mailer'
end
