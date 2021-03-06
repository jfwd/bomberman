class Game
  constructor: () ->
    @canvas   = new Kinetic.Stage({container: 'game-canvas', width: 640, height: 480})
    @configs  = @init_default_config()
    @statuses = @init_statuses()
    @scenes   = {
      'welcome'     : new WelcomeScene(this, new WelcomeView(@canvas)),
      'battle_field': new BattleFieldScene(this, new BattleFieldView(@canvas))
    }
    @current_scene = null

  get_config: (key) -> @configs[key]

  update_status: (key, value) -> @statuses[key] = value

  get_status: (key) -> @statuses[key]

  init_default_config: () ->
    {

    }

  init_statuses: () ->
    {

    }


  kick_off: ()  -> @switch_scene('welcome')

  mod_stage: (current_stage, adjustment) ->

  reset: () ->

  switch_scene: (type) ->
    target_scene = @scenes[type]
    @current_scene.stop() unless _.isEmpty(@current_scene)
    target_scene.start()
    @current_scene = target_scene


