Rails.application.routes.draw do
  resources :rent_discounts
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


  resources :members
  resources :projects
  resources :transfers
  resources :invitations, only: [:create, :edit]

end
