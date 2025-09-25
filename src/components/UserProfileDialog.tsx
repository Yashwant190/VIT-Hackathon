import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { UserData } from './LoginDialog';
import { User, Mail, Phone, Building, Briefcase, Calendar, Save, LogOut } from 'lucide-react';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  onUpdateProfile: (userData: UserData) => void;
  onLogout: () => void;
}

export function UserProfileDialog({ 
  isOpen, 
  onClose, 
  userData, 
  onUpdateProfile,
  onLogout 
}: UserProfileDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: userData.username,
    email: userData.email,
    phone: userData.phone,
    company: userData.company || '',
    role: userData.role || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const updatedUserData: UserData = {
      ...userData,
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      company: formData.company || undefined,
      role: formData.role || 'User'
    };

    onUpdateProfile(updatedUserData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      company: userData.company || '',
      role: userData.role || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            User Profile
          </DialogTitle>
          <DialogDescription>
            View and manage your profile information and account settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600">
                  <AvatarFallback className="text-white font-bold text-xl">
                    {getInitials(userData.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{userData.username}</h3>
                  <p className="text-muted-foreground">{userData.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {userData.role || 'User'}
                    </Badge>
                    {userData.company && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {userData.company}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Member since
                  </div>
                  <p className="text-sm font-medium">{formatDate(userData.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-username" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Username
                      </Label>
                      <Input
                        id="edit-username"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={errors.username ? 'border-red-500' : ''}
                      />
                      {errors.username && (
                        <p className="text-sm text-red-500">{errors.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-role" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Role
                      </Label>
                      <Input
                        id="edit-role"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        placeholder="Your role/position"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-company" className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Company
                      </Label>
                      <Input
                        id="edit-company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Your company name"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Username</p>
                        <p className="font-medium">{userData.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{userData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{userData.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{userData.role || 'User'}</p>
                      </div>
                    </div>

                    {userData.company && (
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-teal-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium">{userData.company}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">{formatDate(userData.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logout Button */}
          <div className="flex justify-end">
            <Button 
              variant="destructive" 
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}