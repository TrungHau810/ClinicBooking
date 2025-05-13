from rest_framework import permissions

class IsDoctorOrSelf(permissions.BasePermission):
    """
    - Bác sĩ chỉ được chỉnh sửa 'medical_history'.
    - Bệnh nhân chỉ được chỉnh sửa hồ sơ của mình, và không được sửa 'medical_history'.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        if request.method in ['PUT', 'PATCH']:
            requested_fields = set(request.data.keys())

            if user.is_doctor:
                # Bác sĩ chỉ được chỉnh sửa medical_history
                allowed_fields = {'medical_history'}
                return requested_fields.issubset(allowed_fields)

            if user.is_patient and obj.user == user:
                # Bệnh nhân chỉ được sửa thông tin của mình, trừ medical_history
                forbidden_fields = {'medical_history'}
                return not (requested_fields & forbidden_fields)

            return False  # Người dùng khác không được phép

        # Cho phép GET (đọc) nếu là bác sĩ hoặc là chính bệnh nhân
        if request.method in permissions.SAFE_METHODS:
            return user.is_doctor or (user.is_patient and obj.user == user)

        return False  # POST, DELETE bị từ chối
