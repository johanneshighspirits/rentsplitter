Rails.application.routes.draw do

  root 'application#index'

  get     '/login',   to: 'sessions#new'
  post    '/login',   to: 'sessions#create'
  delete  '/logout',  to: 'sessions#destroy'

  get     '/signup',  to: 'members#new'
  post    '/signup',  to: 'members#create'

  post    '/activate', to: 'members#activate'

  get     '/invite',  to: 'members#invite'
  post    '/invite',  to: 'members#create_and_invite'

  get     '/members/:id/projects', to: 'projects#for_member'
  get     '/projects/:id/transfers', to: 'transfers#for_project'
  post    '/projects/:id/send_invoices', to: 'projects#send_invoices'
  get     '/project_name/:id/member/:member_id',  to: 'projects#name_for'

  post    '/mail/reports', to: 'mail_reports#mail_report'

  get     '/calendar',  to: 'calendar_events#index', as: :calendar_events
  get     '/calendar/:id',  to: 'calendar_events#show'
  post    '/calendar_events/event_reminder',  to: 'calendar_events#send_event_reminders'

  resources :members
  resources :projects
  resources :transfers
  resources :rent_discounts
  resources :invitations, only: [:create, :edit]
  resources :memberships, only: [:update, :destroy]
  resources :password_resets, only: [:new, :edit, :create, :update]
  resources :calendar_events

end
