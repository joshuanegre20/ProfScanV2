<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LoginAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $email;
    public $time;
    public $ip;
    public $userAgent;

    /**
     * Create a new message instance.
     */
    public function __construct($name, $email, $time, $ip, $userAgent)
    {
        $this->name = $name;
        $this->email = $email;
        $this->time = $time;
        $this->ip = $ip;
        $this->userAgent = $userAgent;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('🔐 Admin Login Alert - ProfScan')
                    ->view('login-alert');
    }
}