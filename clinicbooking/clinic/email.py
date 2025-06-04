from django.core.mail import EmailMultiAlternatives
from clinicbooking import settings


def send_appointment_successfull_email(appointment):
    """
    Gửi email xác nhận đặt lịch khám thành công
    :param appointment: Lịch khám
    :return:
    """
    healthrecord = appointment.healthrecord
    schedule = appointment.schedule
    doctor = schedule.doctor
    infodr = doctor.doctor
    subject = "Đặt lịch khám bệnh thành công - Clinic Booking"
    from_email = settings.DEFAULT_FROM_EMAIL
    to_email = [healthrecord.email]

    text_content = f"""
    Chào {healthrecord.full_name},

    Bạn đã đặt lịch khám thành công (Mã: #{appointment.id}).
    Vui lòng thanh toán trong vòng 30 phút kể từ lúc đặt.
    Nếu đã thanh toán, vui lòng bỏ qua email này.

    Trân trọng,
    Clinic Booking App
    """

    html_content = f"""
    <p>Chào <strong>{healthrecord.full_name}</strong>,</p>

    <p>Bạn đã đặt lịch khám bệnh thành công tại <strong>Clinic Booking</strong>.</p>

    <p><strong>Thông tin lịch khám:</strong></p>
    <ul>
        <li><strong>Mã lịch hẹn:</strong> #{appointment.id}</li>
        <li><strong>Mã hồ sơ sức khoẻ:</strong> #{healthrecord.id}</li>
        <li><strong>Ngày khám:</strong> {schedule.date.strftime('%d/%m/%Y')}</li>
        <li><strong>Thời gian:</strong> {schedule.start_time} - {schedule.end_time}</li>
        <li><strong>Bác sĩ:</strong> {doctor.full_name}</li>
        <li><strong>Bệnh viện:</strong> {infodr.hospital}</li>
        <li><strong>Chuyên khoa:</strong> {infodr.specialization}</li>
    </ul>

    <p><em style="color:red;"><strong>Lưu ý:</strong> Vui lòng thanh toán trong vòng <strong>30 phút</strong> kể từ khi đặt lịch.<br>
    Nếu đã thanh toán, vui lòng bỏ qua email này.</em></p>

    <p style="margin-top:20px;">Trân trọng,<br><em>Đội ngũ Clinic Booking</em></p>
    """

    msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    msg.attach_alternative(html_content, "text/html")
    msg.send()


def send_otp_email(user, otp):
    subject = "Clinic App: Mã OTP đặt lại mật khẩu"
    from_email = "noreply@yourdomain.com"
    to = [user.email]

    text_content = f"""
    Xin chào {user.full_name},

    Bạn vừa yêu cầu khôi phục mật khẩu cho tài khoản của mình trên hệ thống của chúng tôi.

    Mã OTP của bạn là: {otp}

    Lưu ý quan trọng:
    - Mã OTP này có hiệu lực trong 10 phút kể từ thời điểm bạn nhận được email này.
    - Tuyệt đối không cung cấp mã xác thực này cho bất kỳ ai, kể cả nhân viên hỗ trợ.

    Nếu bạn KHÔNG yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.

    Trân trọng,
    Đội ngũ hỗ trợ khách hàng
    """

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Xin chào <strong>{user.full_name}</strong>,</p>

        <p>Bạn vừa yêu cầu khôi phục mật khẩu cho tài khoản của mình trên hệ thống của chúng tôi.</p>

        <p><strong>Mã OTP của bạn là: <span style="font-size: 18px; color: #d63031;">{otp}</span></strong></p>

        <p><strong>Lưu ý quan trọng:</strong></p>
        <ul>
          <li>Mã OTP này có hiệu lực trong <strong>10 phút</strong> kể từ thời điểm bạn nhận được email này.</li>
          <li><strong style="color: red;">Tuyệt đối không cung cấp mã xác thực này cho bất kỳ ai</strong>, kể cả nhân viên hỗ trợ.</li>
        </ul>

        <p>Nếu bạn <strong>KHÔNG</strong> yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này hoặc liên hệ ngay với bộ phận hỗ trợ của chúng tôi để được giúp đỡ.</p>

        <p>Trân trọng,<br />
        Đội ngũ hỗ trợ khách hàng</p>
      </body>
    </html>
    """

    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()
