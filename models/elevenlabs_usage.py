# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import datetime, timedelta
import uuid


class ElevenLabsUsage(models.Model):
    _name = 'elevenlabs.usage'
    _description = 'ElevenLabs AI Usage Tracking'
    _order = 'create_date desc'
    _rec_name = 'session_id'

    # Session identification
    session_id = fields.Char(
        string='Session ID',
        required=True,
        index=True,
        help='Unique identifier for the conversation session'
    )

    # User identification
    user_id = fields.Many2one(
        'res.users',
        string='User',
        index=True,
        ondelete='cascade',
        help='Logged-in user (null for public users)'
    )

    user_identifier = fields.Char(
        string='User Identifier',
        index=True,
        help='UUID for tracking public users based on IP address'
    )

    # Usage tracking
    message_count = fields.Integer(
        string='Message Count',
        default=1,
        help='Number of messages in this session'
    )

    # Timestamp
    create_date = fields.Datetime(
        string='Timestamp',
        default=fields.Datetime.now,
        required=True,
        index=True,
        help='When this usage record was created'
    )

    # Metadata
    ip_address = fields.Char(
        string='IP Address',
        help='IP address of the user'
    )

    user_agent = fields.Char(
        string='User Agent',
        help='Browser user agent string'
    )

    _sql_constraints = [
        (
            'unique_session_user',
            'UNIQUE(session_id, user_id, user_identifier)',
            'A usage record for this session/user combination already exists.'
        )
    ]

    @api.model
    def get_or_create_usage_record(self, session_id, user_id=None, user_identifier=None, ip_address=None, user_agent=None):
        """
        Get existing usage record or create a new one.
        Returns the usage record and whether it was created.
        """
        # Search for existing record
        domain = [('session_id', '=', session_id)]

        if user_id:
            domain.append(('user_id', '=', user_id))
        else:
            domain.append(('user_identifier', '=', user_identifier))

        usage_record = self.search(domain, limit=1)

        if usage_record:
            # Increment message count
            usage_record.message_count += 1
            return usage_record, False
        else:
            # Create new record
            record_data = {
                'session_id': session_id,
                'ip_address': ip_address,
                'user_agent': user_agent,
            }

            if user_id:
                record_data['user_id'] = user_id
            else:
                record_data['user_identifier'] = user_identifier

            usage_record = self.create(record_data)
            return usage_record, True

    @api.model
    def check_user_limits(self, user_id=None, user_identifier=None, daily_limit=0, global_limit=0, session_limit=0, session_id=None):
        """
        Check if user has exceeded any usage limits.

        Returns a dictionary with:
        - can_show_widget: bool
        - daily_usage: int
        - global_usage: int
        - session_usage: int
        - daily_limit: int
        - global_limit: int
        - session_limit: int
        - reason: str (if limit exceeded)
        """
        now = fields.Datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Build domain for counting
        daily_domain = [('create_date', '>=', today_start)]
        global_domain = []

        if user_id:
            daily_domain.append(('user_id', '=', user_id))
            global_domain.append(('user_id', '=', user_id))
        elif user_identifier:
            daily_domain.append(('user_identifier', '=', user_identifier))
            global_domain.append(('user_identifier', '=', user_identifier))

        # Count daily usage
        daily_usage = self.search_count(daily_domain)

        # Count global usage
        global_usage = self.search_count(global_domain)

        # Count session usage
        session_usage = 0
        if session_id:
            session_domain = [('session_id', '=', session_id)]
            session_records = self.search(session_domain)
            session_usage = sum(session_records.mapped('message_count'))

        # Check limits
        result = {
            'can_show_widget': True,
            'daily_usage': daily_usage,
            'global_usage': global_usage,
            'session_usage': session_usage,
            'daily_limit': daily_limit,
            'global_limit': global_limit,
            'session_limit': session_limit,
            'reason': None
        }

        # Check daily limit
        if daily_limit > 0 and daily_usage >= daily_limit:
            result['can_show_widget'] = False
            result['reason'] = 'daily_limit_exceeded'
            return result

        # Check global limit
        if global_limit > 0 and global_usage >= global_limit:
            result['can_show_widget'] = False
            result['reason'] = 'global_limit_exceeded'
            return result

        # Check session limit
        if session_limit > 0 and session_usage >= session_limit:
            result['can_show_widget'] = False
            result['reason'] = 'session_limit_exceeded'
            return result

        return result

    @api.model
    def generate_user_identifier_from_ip(self, ip_address):
        """
        Generate a consistent UUID for a public user based on IP address.
        Uses a hash to ensure the same IP always gets the same identifier.
        """
        import hashlib
        # Create a hash of the IP address
        hash_object = hashlib.sha256(ip_address.encode())
        # Convert to UUID format
        return str(uuid.UUID(bytes=hash_object.digest()[:16]))

    @api.model
    def cleanup_old_records(self, days_to_keep=30):
        """
        Clean up usage records older than specified days.
        """
        cutoff_date = fields.Datetime.now() - timedelta(days=days_to_keep)
        old_records = self.search([('create_date', '<', cutoff_date)])
        old_records.unlink()
        return len(old_records)
