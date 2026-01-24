# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    elevenlabs_agent_id = fields.Char(
        string='ElevenLabs Agent ID',
        config_parameter='elevenlabs_agent.agent_id',
        help='The Agent ID from your ElevenLabs dashboard. '
             'You can find this in the agent settings.'
    )
    
    elevenlabs_enabled = fields.Boolean(
        string='Enable ElevenLabs Assistant',
        config_parameter='elevenlabs_agent.enabled',
        default=True,
        help='Enable or disable the ElevenLabs AI shopping assistant on your website.'
    )
    
    elevenlabs_widget_position = fields.Selection([
        ('bottom-right', 'Bottom Right'),
        ('bottom-left', 'Bottom Left'),
        ('top-right', 'Top Right'),
        ('top-left', 'Top Left'),
    ], string='Widget Position',
        config_parameter='elevenlabs_agent.widget_position',
        default='bottom-right',
        help='Position of the ElevenLabs widget on the page.'
    )